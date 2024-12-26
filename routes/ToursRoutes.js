const express = require('express');
const TourController = require('../controllers/TourController');

const authController = require('../controllers/authController');

const router = express.Router();
router
  .route('/top-5-tours')
  .get(TourController.topFiveToursMiddleware, TourController.getAllTours);
router.route('/tours-stats').get(TourController.getTourStats);
router.route('/montly-plan/:year').get(TourController.getMontlyPlan);
router
  .route('/')
  .get(authController.protected, TourController.getAllTours)
  .post(TourController.createNewTour);
router
  .route('/:id')
  .get(
    authController.protected,
    authController.restrictTo(['admin', 'lead-guide']),
    TourController.getTourById,
  )
  .patch(TourController.updateTourById)
  .delete(
    authController.protected,
    // authController.restrictTo(['admin', 'lead-guide']),
    TourController.deleteTourById,
  );
module.exports = router;
