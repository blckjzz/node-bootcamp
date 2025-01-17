const express = require('express');
const ReviewController = require('../controllers/ReviewController');
const authController = require('../controllers/AuthController');
const Review = require('../models/reviewModel');

const router = express.Router({ mergeParams: true });

router.use(authController.protected);
router
  .route('/')
  .get(
    authController.restrictTo(['user', 'admin']),
    ReviewController.getAllReviews,
  )
  .post(authController.restrictTo('user'), ReviewController.createReview);

router
  .route('/:userId/user-reviews') // FIX
  .get(authController.restrictTo('users'), ReviewController.getUserOwnReviews);

router
  .route('/:id')
  .get(ReviewController.getReviewById)
  .patch(
    authController.restrictTo('user', 'admin'),
    // ReviewController.logger,
    ReviewController.update,
  )
  .delete(authController.restrictTo('user', 'admin'), ReviewController.delete);

module.exports = router;
