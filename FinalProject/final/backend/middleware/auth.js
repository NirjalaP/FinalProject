const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token =
    req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Verify user authentication
const authenticate = async (req, res, next) => {
  try {
    let user;

    // Check for JWT token
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );
      user = await User.findById(decoded.userId);
    }

    // Check for session (OAuth users)
    if (!user && req.isAuthenticated && req.isAuthenticated()) {
      user = req.user;
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Authentication required" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

// Optional authentication (for guest users)
const optionalAuth = async (req, res, next) => {
  try {
    let user;

    // Check for JWT token
    const token =
      req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret"
      );
      user = await User.findById(decoded.userId);
    }

    // Check for session (OAuth users)
    if (!user && req.isAuthenticated && req.isAuthenticated()) {
      user = req.user;
    }

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "7d",
  });
};

// Set token cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

module.exports = {
  verifyToken,
  authenticate,
  isAdmin,
  optionalAuth,
  generateToken,
  setTokenCookie,
};
