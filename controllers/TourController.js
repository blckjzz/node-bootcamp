const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.deleteTourById = factory.deleteOne(Tour);

exports.updateTourById = factory.updateOne(Tour);

exports.createNewTour = factory.createOne(Tour);

exports.getTourById = factory.getOneById(Tour, { path: 'reviews' });

exports.getAllTours = factory.getAll(Tour);

exports.toursWithinDistance = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide lat and lng in the correct format: lat,lng',
        400,
      ),
    );
  // console.log(distance, lat, lng, unit);

  const radius = unit === 'km' ? distance / 6378.1 : distance / 3963.2;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

// '/distances/:latlng/unit/:unit'
exports.getToursByProximity = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'km' ? 0.001 : 0.000621371;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide lat and lng in the correct format: lat,lng',
        400,
      ),
    );
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, // converting meters to km === didive by 1000 or multiply by 0.001;
      },
    },
    {
      $project: {
        id: 1,
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.topFiveToursMiddleware = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,summary,price,ratingsQuantity,difficulty';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.query);
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 3.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  // console.log(stats);
  res.status(200).json({
    status: 'success',
    stats: stats,
  });
});

exports.getMontlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  console.log(`Param: ${year}`);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // bring each matching record to result list
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    { $project: { _id: 0 } },
    {
      $sort: { numTourStart: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  // console.log(plan);
  res.status(200).json({
    status: 'success',
    plan: plan,
  });
});
