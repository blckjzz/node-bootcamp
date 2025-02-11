const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const { promisify } = require('util');
const { response } = require('express');
const Email = require('../utils/email');
const Stripe = require('stripe');
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Corrigido de 'payment_method_type'
    // success_url: `${req.protocol}://${req.get('host')}`,
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-bookings`,
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

const createBookingCheckoutDB = catchAsync(async (session) => {
  // const { tour, price, user } = req.query;
  const tour = session.client_reference_id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  // const price = session.line_items.data[0].price.unit_amount / 100;

  const user = (await User.findOne({ email: session.customer_email })).id;

  // if (!tour || !price || !user) return next();

  return await Booking.create({ tour, price, user });
});

exports.webhookStripeSession = async (req, res, next) => {
  console.log(`Stripe hook received request!`);

  let event;
  const signature = req.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(
      req.body.toString(),
      signature,
      process.env.STRIPE_SIGNATURE_KEY,
    );
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  console.log(`Processing event: ${event.id}`);

  // 🔥 Responde ao Stripe imediatamente para evitar timeout
  res.status(200).send('Webhook received');

  try {
    console.log(`event data: ${event.data.object}`);
    const booking = await createBookingCheckoutDB(event.data.object);
    const booking2 = createBookingCheckoutDB(event.data.object);
    console.log(`Booking created: ${JSON.stringify(booking)}`);
    console.log(`Booking created2: ${JSON.stringify(booking2)}`);
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
  }
};

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOneById(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
