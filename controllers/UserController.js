const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

exports.updateUserById = factory.updateOne(User);
exports.deleteUserById = factory.deleteOne(User);
exports.getUserById = factory.getOneById(User);
exports.getAllUsers = factory.getAll(User);

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const fileExtension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${fileExtension}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('This file type is not permited!', 400), false);
  }
};

// multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  req.file.filename = filename;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${filename}`);

  next();
});

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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You can not update password with this function. Please use "update-password" function',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  if (req.body.data) req.body = req.body.data;
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const user = await User.findOneAndUpdate({ _id: req.user.id }, filteredBody, {
    new: true,
    runValidators: true,
  });
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
