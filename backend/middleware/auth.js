const jwt = require("jsonwebtoken");

// =======================================
// PROTECT ROUTES
// =======================================

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Save user data in request
    req.user = decoded;

    next();

  } catch (error) {
    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// =======================================
// ROLE MIDDLEWARES
// =======================================

// ADMIN ONLY
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};

// TECH LEAD ONLY
const techLeadOnly = (req, res, next) => {
  if (req.user.role !== "tech_lead") {
    return res.status(403).json({
      success: false,
      message: "Tech Lead access only",
    });
  }

  next();
};

// HR ONLY
const hrOnly = (req, res, next) => {
  if (req.user.role !== "hr") {
    return res.status(403).json({
      success: false,
      message: "HR access only",
    });
  }

  next();
};

// EMPLOYEE ONLY
const employeeOnly = (req, res, next) => {
  if (req.user.role !== "employee") {
    return res.status(403).json({
      success: false,
      message: "Employee access only",
    });
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
  techLeadOnly,
  hrOnly,
  employeeOnly,
};