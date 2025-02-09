const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const { promisify } = require('util');
const { response } = require('express');
const Email = require('../utils/email');
const Stripe = require('stripe');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Corrigido de 'payment_method_type'
    // success_url: `${req.protocol}://${req.get('host')}`,
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email, // Corrigido de 'costumer_email'
    client_reference_id: req.params.tourId,
    mode: 'payment', // Necessário na versão 17
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: tour.name,
            description: tour.summary,
          },
          unit_amount: tour.price * 100, // Corrigido de 'amout' para 'unit_amount'
        },
        quantity: 1,
      },
    ],
  });

  //   const session = await stripe.checkout.session.create({
  //     payment_method_type: ['card'],
  //     success_url: `${req.protocol}://${req.get('host')}`,
  //     cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}}`,
  //     costumer_email: req.user.email,
  //     client_reference_id: req.params.tourId,
  //     line_items: [
  //       {
  //         name: tour.name,
  //         description: tour.summary,
  //         amout: tour.price * 100,
  //         currency: 'brl',
  //         quantity: 1,
  //       },
  //     ],
  //   });
  res.status(200).json({ status: 'success', session });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, price, user } = req.query;

  if (!tour || !price || !user) return next();

  await Booking.create({ tour, price, user });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOneById(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
