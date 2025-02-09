const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setUserId = catchAsync((req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});
exports.logger = catchAsync((req, res, next) => {
  console.log(`debbuging http request:`);
  console.log(req);
  next();
});

exports.getUserOwnReviews = catchAsync(async (req, res, next) => {
  if (!req.user)
    return next(new AppError('Please log-in to access this feature', 403));

  const reviews = await Review.find({ user: req.user.id });
  res.status(200).json({
    status: 'success',
    data: { reviews: reviews },
  });
});

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.delete = factory.deleteOne(Review);
exports.update = factory.updateOne(Review);
exports.getReviewById = factory.getOneById(Review);
