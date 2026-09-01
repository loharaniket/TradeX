// Authentication middleware placeholder
// This will be fully expanded in Phase 4 (User Authentication)
const protect = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  // Token verification will be added in Phase 4
  next();
};

module.exports = { protect };
