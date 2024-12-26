const slugify = require('slugify');

const validator = require('validator');

const mongose = require('mongoose');

const tourSchema = new mongose.Schema(
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
    ratings: {
      type: Number,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'RatingAverage should be bellow 0'],
      max: [5, 'RatingAverage must under 5'],
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
    secretTour: {
      type: Boolean,
      default: false,
    },
    slug: String,
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

tourSchema.virtual('durationWeeks').get(function () {
  return Math.floor(this.duration / 7);
});

// runs before saving or creating a new record in the database
tourSchema.pre('save', function (next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(['find', 'findOne'], function (docs, next) {
  // console.log(docs);
  console.log(`Query took: ${Date.now() - this.start} ms to execute.`);
  next();
});

tourSchema.pre('aggregate', function (next) {
  console.log(this.pipeline());
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongose.model('Tour', tourSchema);

module.exports = Tour;
