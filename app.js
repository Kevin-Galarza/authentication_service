require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Replace with your MongoDB connection string
const mongoDBUrl = 'mongodb+srv://kgalarza:kHmj2fxe5VU5rNBz@deeptestcluster.kdfrt6z.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoDBUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(cors());
app.use(express.json());

// Import and use the authentication routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Authentication service running on port ${PORT}`);
});
