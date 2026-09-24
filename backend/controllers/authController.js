const crypto = require('crypto');
const User = require('../models/User');

const generateToken = () => crypto.randomBytes(24).toString('hex');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }
    if (!['organizer', 'participant'].includes(role)) {
      return res.status(400).json({ message: 'role must be "organizer" or "participant"' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const authToken = generateToken();
    const user = await User.create({ name, email, password, role, authToken });

    res.status(201).json({
      token: authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    user.authToken = generateToken();
    await user.save();

    res.json({
      token: user.authToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  req.user.authToken = null;
  await req.user.save();
  res.json({ message: 'Logged out' });
};
