const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const apiFeatures = require('../utils/apiFeatures');
const mailer = require('../utils/email');

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { response } = require('express');

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
  const token = signJWToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  sendResponse(user, statusCode, res);
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  sendSignedToken(newUser, 200, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please provide a valid email and password', 401));

  const user = await User.findOne({ email: email }).select('+password');
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError('Verify user email or password and try again', 401),
    );
  }

  const token = signJWToken(user._id);
  // verify if password is the same password with bcrypt
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
});

exports.protected = catchAsync(async (req, res, next) => {
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('Please check authorization token and retry', 401),
    );
  }

  try {
    const tokenVerification = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    );
    // console.log('Token:', token);
    const freshUser = await User.findById(tokenVerification.id);
    if (!freshUser) {
      return next(
        new AppError('The token belongs to a user that no longer exists.', 401),
      );
    }
    // console.log('Decoded token:', tokenVerification);
    // console.log('User fetched from DB:', freshUser);
    // console.log('Fetched User:', freshUser);

    if (freshUser.changedPasswordAfter(tokenVerification.iat)) {
      return next(new AppError('User recently changed password', 401));
    }

    req.user = freshUser;
    next();
  } catch (err) {
    // console.error('Token Verification Error:', err);
    return next(new AppError('Invalid or expired token', 401));
  }
});

exports.restrictTo = (roles) => {
  return catchAsync(async (req, res, next) => {
    // console.log(`Ther user role is: ${req.user.role}`);
    // console.log(`The allowed roles are: ${roles}`);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You can not perform this action with current role.', 403),
      );
    }
    // console.log(
    //   `Ther role is:${req.user.role} and is it allowed? ${roles.includes(req.user.role) ? true : false}`,
    // );
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

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

  console.log(`reset url + token: ${resetURL}`);

  const message = `To reset your password please submit: new password and passwordConfirm to ${resetURL}`;

  try {
    await mailer.sendMail({
      email: user.email,
      subject: `You requested a password change: your token is valid for 10 minutes`,
      message: `Please use the following token to reset your password: ${resetURL}`,
    });

    res.status(200).json({
      status: 'sucess',
      message,
      // data: {
      //   user: user,
      //   resetToken,
      // },
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

  // console.log(token, hashedToken);

  // console.log(`user: ${user}`);

  // if()

  res.status(200).json({
    status: 'sucess',
    token: JWTtoken,
  });
});

const decodeBearerToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // find currenct user
  const { token, currentPass, password, passwordConfirm } = req.body;
  const decodedToken = await decodeBearerToken(token);

  // const user = await User.findOne({ _id: decodedToken.id }).select('+password');
  const user = await User.findById(req.user.id).select('+password');

  console.log(req.body, user);
  if (!user || !(await user.correctPassword(currentPass, user.password))) {
    return next(
      new AppError('Verify user email or password and try again', 401),
    );
  }
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  // save new password
  await user.save();

  // generate new token and send it back
  const newToken = signJWToken(user._id);
  res.status(200).json({
    status: 'sucess',
    token: newToken,
    data: {
      user: user,
      // resetToken,
    },
  }); // ask current password
  // send token JWT token;
});
