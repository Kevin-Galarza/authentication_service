const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { check, validationResult } = require('express-validator');

// User registration route
router.post(
  '/register',
  [
    check('username', 'Username is required').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required and must be at least 8 characters long').isLength({ min: 8 })
  ],
  authController.register
);

// User login route
router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
  ],
  authController.login
);

router.post("/forgot-password", authController.forgotPassword);

router.post("/reset-password/:token", 
[
  check('password', 'Password is required and must be a least 8 characters long').isLength({ min: 8 })
],
authController.resetPassword);

module.exports = router;
