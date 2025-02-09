const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const apiFeatures = require('../utils/apiFeatures');
const { response } = require('express');
// const mailer = require('../utils/email');
const Email = require('../utils/email');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const crypto = require('crypto');

const signJWToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
    // expiresIn: '90d',
  });
};

const sendResponse = (user, statusCode, res) => {
  res.status(statusCode).json({
    status: 'success',
    data: {
      user: user,
    },
  });
};

const sendSignedToken = async (user, statusCode, req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const token = signJWToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    secure: true,
    httpOnly: true,
    sameSite: isProduction ? 'None' : 'Lax', // Ajusta conforme o ambiente
    path: '/',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  sendSignedToken(newUser, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please provide a valid email and password', 401));

  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('Verify user email or password and try again', 401),
    );
  }

  sendSignedToken(user, 200, req, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    secure: true,
    httpOnly: true,
    sameSite: isProduction ? 'None' : 'Lax', // Ajusta conforme o ambiente
    path: '/',
  };

  res.cookie('jwt', 'logging out', cookieOptions);

  res.status(200).json({
    status: 'success',
  });
});

exports.protected = catchAsync(async (req, res, next) => {
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('Please check authorization credentials and retry.', 401),
    );
  }

  try {
    const tokenVerification = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    );
    const freshUser = await User.findById(tokenVerification.id);
    if (!freshUser) {
      return next(
        new AppError('The token belongs to a user that no longer exists.', 401),
      );
    }
    if (freshUser.changedPasswordAfter(tokenVerification.iat)) {
      return next(new AppError('User recently changed password', 401));
    }

    res.locals.user = freshUser;
    req.user = freshUser;
    next();
  } catch (err) {
    // console.error('Token Verification Error:', err);
    return next(new AppError('Invalid or expired token', 401));
  }
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    let token = '';
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const tokenVerification = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
      );
      const freshUser = await User.findById(tokenVerification.id);
      if (!freshUser) {
        return next();
      }

      if (freshUser.changedPasswordAfter(tokenVerification.iat)) {
        return next();
      }

      // req.user = freshUser;
      res.locals.user = freshUser;
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};

exports.restrictTo = (roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You can not perform this action with current role.', 403),
      );
    }
    next();
  });
};

// get user
// generate token
//

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new AppError('E-mail or User could not be found!', 404));
  }

  try {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    const message = `To reset your password please submit: new password and passwordConfirm to ${resetURL}`;
    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: 'sucess',
      message,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Please try again', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordTokenExpires: { $gt: new Date().toISOString() },
  });

  if (!user) {
    return next(new AppError('Token has expired.'));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordTokenExpires = undefined;

  await user.save();
  const JWTtoken = await signJWToken(user._id);
  res.status(200).json({
    status: 'sucess',
    token: JWTtoken,
  });
});

const decodeBearerToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  let { passwordCurrent, passwordConfirm, password } = req.body;

  // Verifica se todas as variáveis são undefined ou vazias
  if (req.body.data) {
    // Garante que req.body.data existe
    passwordCurrent = req.body.data.passwordCurrent || passwordCurrent;
    password = req.body.data.password || password;
    passwordConfirm = req.body.data.passwordConfirm || passwordConfirm;
  }

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  const newToken = signJWToken(user._id);
  res.status(200).json({
    status: 'success',
    token: newToken,
    data: {
      user: user,
      // resetToken,
    },
  }); // ask current password
  // send token JWT token;
});
