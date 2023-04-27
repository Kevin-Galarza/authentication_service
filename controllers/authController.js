const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const PasswordResetToken = require("../models/passwordResetTokenModel");
const RefreshToken = require('../models/refreshTokenModel');
const { validationResult } = require("express-validator");
const postmark = require("postmark");
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
};

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Handle user registration
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role, username, email, password } = req.body;

  try {
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = hashPassword(password, salt);

    const newUser = new User({
      role,
      username,
      email,
      password: hashedPassword,
      salt,
    });

    const savedUser = await newUser.save();

    const { accessToken, refreshToken } = generateTokens(savedUser._id, savedUser.role);
    const newRefreshToken = new RefreshToken({ token: refreshToken, user: savedUser._id });
    await newRefreshToken.save();

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
};

// Handle user login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const hashedPassword = hashPassword(password, user.salt);

    if (user.password === hashedPassword) {
      const { accessToken, refreshToken } = generateTokens(user._id, user.role);
      const newRefreshToken = new RefreshToken({ token: refreshToken, user: user._id });
      await newRefreshToken.save();

      res.status(201).json({ accessToken, refreshToken });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// Handle user forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send the password reset email using the Postmark template
    await client.sendEmailWithTemplate({
      From: process.env.EMAIL_FROM,
      To: user.email,
      TemplateId: your_template_id,
      TemplateModel: {
        reset_link: `http://localhost:3000/reset-password/${token}`,
      },
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: "Error sending password reset email" });
  }
};

// Handle user reset password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    const user = await User.findById(passwordResetToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = hashPassword(newPassword, salt);

    user.password = hashedPassword;
    user.salt = salt;
    await user.save();

    await PasswordResetToken.findByIdAndDelete(passwordResetToken._id);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAccessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES,
    });

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Refresh token expired' });
    } else {
      res.status(500).json({ message: 'Error refreshing token' });
    }
  }
};


exports.revokeRefreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const deletedToken = await RefreshToken.findOneAndDelete({ token: refreshToken });

    if (!deletedToken) {
      return res.status(404).json({ message: 'Refresh token not found' });
    }

    res.status(200).json({ message: 'Refresh token revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Error revoking refresh token' });
  }
};

