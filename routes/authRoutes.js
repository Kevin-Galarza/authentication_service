const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { check, validationResult } = require('express-validator');
const validateJwt = require('../middlewares/validateToken');

// USER REGISTRATION
router.post(
  '/register',
  [
    check('role').optional().isIn(['admin', 'customer']).withMessage('Invalid user role'),
    check('username', 'Username is required').notEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required and must be at least 8 characters long').isLength({ min: 8 })
  ],
  authController.register
);

// USER LOGIN
router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password is required').notEmpty()
  ],
  authController.login
);

// USER FORGOT/RESET PASSWORD
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", 
[
  check('password', 'Password is required and must be a least 8 characters long').isLength({ min: 8 })
],
authController.resetPassword);

// JWT REFRESH
router.post('/refresh', authController.refreshToken);
router.post('/revoke', authController.revokeRefreshToken);

// JWT VALIDATION
router.post('/validate', validateJwt, (req, res) => {
  res.status(200).json({ userId: req.userId });
});

module.exports = router;
