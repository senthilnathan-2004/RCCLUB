// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

import jwt from "jsonwebtoken"
import User from "../models/User.model.js"
import config from "../config/config.js"
import { logger } from "../utils/logger.js"

// Protect routes - verify JWT
export const protect = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. No token provided.",
      })
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret)

      // Get user from token
      const user = await User.findById(decoded.id).select("-password")

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Token is invalid.",
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Your account has been deactivated. Please contact admin.",
        })
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: "Password was recently changed. Please login again.",
        })
      }

      req.user = user
      next()
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again.",
          code: "TOKEN_EXPIRED",
        })
      }
      throw err
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`)
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route.",
    })
  }
}

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      })
    }
    next()
  }
}

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "This route is restricted to administrators only.",
    })
  }
  next()
}

// Treasurer only middleware
export const treasurerOnly = (req, res, next) => {
  if (!["secretary", "joint_secretary", "treasurer", "president"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "This route is restricted to treasurer, secretary, joint secretary, and president only.",
    })
  }
  next()
}

// Verify refresh token
export const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      })
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret)

    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      })
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken)

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked.",
      })
    }

    req.user = user
    req.refreshToken = refreshToken
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token.",
    })
  }
}

export default { protect, authorize, adminOnly, treasurerOnly, verifyRefreshToken }
