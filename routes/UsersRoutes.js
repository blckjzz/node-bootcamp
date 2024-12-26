const express = require('express');

const router = express.Router();
const userController = require('../controllers/UserController');

const authController = require('../controllers/AuthController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch(
  '/update-password',
  authController.protected,
  authController.updatePassword,
);
router.patch(
  '/update-my-data',
  authController.protected,
  userController.updateUserData,
);
router.patch(
  '/delete-user-data',
  authController.protected,
  userController.deleteUserData,
);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUserById)
  .delete(userController.deleteUserById);

module.exports = router;
