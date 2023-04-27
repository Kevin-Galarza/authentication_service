const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
  // Get the token from the request header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied: No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = validateToken;
