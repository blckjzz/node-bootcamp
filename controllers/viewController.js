// const Review = require('../models/reviewModel');
// const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();

  // Renderize o template 'overview' com os dados
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getLogin = catchAsync(async (req, res) => {
  // Renderize o template 'overview' com os dados
  res.status(200).render('login', {
    title: 'Login page',
    // tour,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) return next(new AppError('Tour could not be found.', 404));

  // Renderize o template 'overview' com os dados
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.myAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account data',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
