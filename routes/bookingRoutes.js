const express = require('express');

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/AuthController');

const router = express.Router();

router.use(authController.protected);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo(['lead-guide', 'admin']));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:bookingId')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
