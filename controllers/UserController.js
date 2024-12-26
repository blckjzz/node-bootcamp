const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const sendResponse = (user, statusCode, res) => {
  res.status(statusCode).json({
    status: 'success',
    data: {
      user: user,
    },
  });
};

exports.getUserById = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This resource is yet not implemented.',
  });
};

exports.updateUserById = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This resource is yet not implemented.',
  });
};

exports.deleteUserById = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This resource is yet not implemented.',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This resource is yet not implemented.',
  });
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'success',
    data: {
      users: users,
    },
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You can not update password with this function. Please use "update-password" function',
        400,
      ),
    );
  }

  const { name, email } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.user.id },
    { name, email },
    {
      new: true,
      runValidators: true,
    },
  );
  // await user.save({ validateBeforeSave: false });
  sendResponse(user, 200, res);
});

exports.deleteUserData = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user.id },
    { active: false },
    // {
    //   new: true,
    //   runValidators: true,
    // },
  );
  // await user.save({ validateBeforeSave: false });
  sendResponse(user, 204, res);
});
