const mongoose = require('mongoose');
// const Tour = require('../models/tourModel');
// const User = require('../models/userModel');

const bookingsSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must belong to a tour.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A booking must belong to a user.'],
  },
  price: {
    type: Number,
    required: [true, 'A booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingsSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'tour', select: 'name' });
  next();
});

const Booking = mongoose.model('Booking', bookingsSchema);

module.exports = Booking;
