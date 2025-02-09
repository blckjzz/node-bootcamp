const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new AppError(`Document by id '${req.params.id}' was not found`, 404),
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(
        new AppError(`document by id '${req.params.id}' was not found`, 404),
      );
    }

    res.status(200).json({
      status: 'success',
      data: document,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);
    res.status(200).json({
      status: 'success',
      data: { document },
    });
  });

exports.getOneById = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;

    if (!document) {
      return next(
        new AppError(`document by id '${req.params.id}' was not found`, 404),
      );
    }

    res.status(200).json({
      status: 'success',
      requested_at: req.requested_at,
      data: { document },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
    // fetch results from database
    const documents = await features.query;
    // const documents = await features.query.explain();

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents },
    });
  });
