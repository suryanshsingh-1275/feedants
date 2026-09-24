const User = require('../models/User');

// Blocks the request if there is no valid session token.
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  const user = await User.findOne({ authToken: token });
  if (!user) return res.status(401).json({ message: 'Invalid or expired session' });

  req.user = user;
  next();
};

// Attaches req.user if a valid token is present, but never blocks the request.
// Used on public routes that still need to know "is this viewer registered?".
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const user = await User.findOne({ authToken: token });
    if (user) req.user = user;
  }
  next();
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: `Only ${role}s can perform this action` });
  }
  next();
};

module.exports = { protect, optionalAuth, requireRole };
