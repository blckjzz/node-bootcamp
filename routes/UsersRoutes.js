const express = require('express');

const router = express.Router();
const userController = require('../controllers/UserController');

const authController = require('../controllers/AuthController');
const { route } = require('./ReviewRoutes');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.use(authController.protected);

router.patch('/updateMyPassword', authController.updatePassword);
router.patch(
  '/update-my-data',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateUserData,
);
router.patch('/delete-user-data', userController.deleteUserData);
router.get('/me', userController.getMyData, userController.getUserById);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUserById)
  .delete(userController.deleteUserById);

// router.use(authController.restrictTo('admin'));

// router.route('/').get(userController.getAllUsers);

// router
//   .route('/:id')
//   .get(userController.getUserById)
//   .patch(userController.updateUserById)
//   .delete(userController.deleteUserById);

module.exports = router;
