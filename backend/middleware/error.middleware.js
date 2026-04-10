// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

import { logger } from "../utils/logger.js"

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404)
  next(error)
}

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found"
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `Duplicate field value: ${field}. Please use another value.`
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message)
    const message = `Validation Error: ${messages.join(", ")}`
    error = new AppError(message, 400)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please login again.", 401)
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token has expired. Please login again.", 401)
  }

  // Default response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

export default { AppError, notFound, errorHandler }
