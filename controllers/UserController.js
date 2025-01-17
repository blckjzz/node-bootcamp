const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.updateUserById = factory.updateOne(User);
exports.deleteUserById = factory.deleteOne(User);
exports.getUserById = factory.getOneById(User);
exports.getAllUsers = factory.getAll(User);

exports.getMyData = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const sendResponse = (user, statusCode, res) => {
  res.status(statusCode).json({
    status: 'success',
    data: {
      user: user,
    },
  });
};

exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'use /sign-up ins',
  });
  next();
};

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
