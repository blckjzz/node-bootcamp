const express = require('express');
const TourController = require('../controllers/TourController');

const reviewRouter = require('../routes/ReviewRoutes');

const authController = require('../controllers/authController');

const router = express.Router();

//nested routes
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-tours')
  .get(TourController.topFiveToursMiddleware, TourController.getAllTours);
router.route('/tours-stats').get(TourController.getTourStats);
router
  .route('/montly-plan/:year')
  .get(
    authController.protected,
    authController.restrictTo(['admin', 'lead-guide', 'guide']),
    TourController.getMontlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(TourController.toursWithinDistance);

router
  .route('/distances/:latlng/unit/:unit')
  .get(TourController.getToursByProximity);

router
  .route('/')
  .get(TourController.getAllTours)
  .post(
    authController.protected,
    authController.restrictTo(['admin', 'lead-guide']),
    TourController.createNewTour,
  );
router
  .route('/:id')
  .get(
    authController.protected,
    authController.restrictTo(['admin', 'lead-guide', 'user', 'guide']),
    TourController.getTourById,
  )
  .patch(
    authController.protected,
    authController.restrictTo(['admin']),
    TourController.uploadToursPhotos,
    TourController.resizeTourImages,
    TourController.updateTourById,
  )
  .delete(
    authController.protected,
    authController.restrictTo(['admin']),
    TourController.deleteTourById,
  );

module.exports = router;
