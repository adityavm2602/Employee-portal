// middleware/roleCheck.js — Role-based access control (RBAC)
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required: ${allowedRoles.join(' or ')}.`,
    });
  }
  next();
};

module.exports = { authorize };
