require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Replace with your MongoDB connection string
const mongoDBUrl = process.env.MONGODB_URI;

mongoose.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const app = express();
app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Import and use the authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authLimiter, authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Authentication service running on port ${PORT}`);
});
