const express = require('express');
const userController = require('../controller/userController');
const authController = require('../controller/authController');

const router = express.Router();


router
    .route('/')
    .get(userController.getAllUsers)
router
    .route('/:id')
    .get(userController.getUser)

router
    .route('/signup')
    .post(authController.signup)

router
    .route('/login')
    .post(authController.login)

router
    .route('/logout')
    .get(authController.logout)


router
    .route('/forgotPassword')
    .post(authController.forgotPassword)

router
    .route('/resetPassword/:token')
    .patch(authController.resetPassword)


router
    .route('/me')
    .get(authController.protect , userController.getMe , userController.getUser)


router
    .route('/updatePassword')
    .patch(authController.protect , authController.updatePassword)


router
    .route('/updateUserInfo')
    .patch(authController.protect , userController.uploadUserPhoto , userController.resizeUserPhoto, userController.updateInfo)


router
    .route('/deleteUser/:id')
    .delete(authController.protect , userController.deleteUser)

module.exports = router;