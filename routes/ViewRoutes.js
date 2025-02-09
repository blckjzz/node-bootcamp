const express = require('express');
const ViewController = require('../controllers/viewController');
const authController = require('../controllers/AuthController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  ViewController.getOverview,
);
router.get('/tour/:slug', authController.isLoggedIn, ViewController.getTour);

router.get('/login', authController.isLoggedIn, ViewController.getLogin);
router.get('/sign-up', authController.isLoggedIn, ViewController.getOverview);
router.get('/me', authController.protected, ViewController.myAccount);
router.get('/my-bookings', authController.protected, ViewController.getMyTours);

module.exports = router;
