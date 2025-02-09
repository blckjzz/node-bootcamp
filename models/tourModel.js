const slugify = require('slugify');

const validator = require('validator');

const mongoose = require('mongoose');
// const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour name is required'],
      unique: true,
      trim: true,
      minLength: [9, 'Tour name should have at least 9 characters.'],
      maxLength: [150, 'Tour name should have at most 150 characters.'],
      validate: {
        validator: (val) => validator.isAlpha(val, ['en-US'], { ignore: ' ' }),
        message: 'A tour must only  contain characters',
      },
    },
    duration: {
      type: Number,
      required: [true, 'Tour require a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour group size must be specified'],
    },
    difficulty: {
      type: String,
      required: [true, 'Tour difficulty is mandatory'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          "Tour difficulty should be either: 'easy', 'medium', 'difficult'",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'RatingAverage should be bellow 0'],
      max: [5, 'RatingAverage must under 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour price is required'],
      min: [0, 'Price must be above 0.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: 'value ({VALUE}) should be lower than the price.',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A description must be provided'],
    },
    imageCover: {
      type: String,
      required: [true, 'A cover image must be provided'],
    },
    images: {
      type: [String], //a array of strings (will be converted to array at the DB)
    },
    cratedAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //Geojson (Long - Lat) -- opposite
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], //Geojson (Long - Lat) -- opposite
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return Math.floor(this.duration / 7);
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// runs before saving or creating a new record in the database
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-role' });
  next();
});

tourSchema.post(['find', 'findOne'], function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} ms to execute.`);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
