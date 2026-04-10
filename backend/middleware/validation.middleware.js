// ============================================
// VALIDATION MIDDLEWARE
// ============================================

import { body, param, query, validationResult } from "express-validator"
import { USER_ROLES } from "../models/User.model.js"

const ADMIN_ROLES = ["president", "secretary", "treasurer", "faculty_coordinator"]
const NON_ADMIN_ROLES = USER_ROLES.filter((role) => !ADMIN_ROLES.includes(role))

// Handle validation errors
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.error("Validation errors:", errors.array()) 
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    })
  }
  next()
}


// User validation rules
export const userValidation = {
  register: [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage("Password must contain uppercase, lowercase, number and special character"),
    validate,
  ],

  login: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("memberId")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Member ID cannot be empty if provided"),
    body("password")
      .optional()
      .notEmpty()
      .withMessage("Password cannot be empty if provided"),
    body("memberId")
      .custom((value, { req }) => {
        // Either memberId or password must be provided
        if (!value && !req.body.password) {
          throw new Error("Either Member ID or Password is required")
        }
        return true
      }),
    validate,
  ],

  adminLogin: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
    body("twoFactorCode")
      .optional()
      .custom((value) => {
        // Skip validation if value is empty, null, or undefined
        if (!value || value.trim().length === 0) {
          return true
        }
        // Validate if value is provided
        const trimmed = value.trim()
        if (!/^\d{6}$/.test(trimmed)) {
          throw new Error("2FA code must be 6 digits")
        }
        return true
      }),
    validate,
  ],

  updateProfile: [
    body("firstName").optional().trim().isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters"),
    body("lastName").optional().trim().isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters"),
    body("phone")
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),
    validate,
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage("Password must contain uppercase, lowercase, number and special character"),
    validate,
  ],

  addMember: [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ max: 50 })
      .withMessage("First name cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("First name can only contain letters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ max: 50 })
      .withMessage("Last name cannot exceed 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Last name can only contain letters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage("Password must contain uppercase, lowercase, number and special character"),
    body("role")
      .optional()
      .isIn(NON_ADMIN_ROLES)
      .withMessage("Invalid role"),
    validate,
  ],
}

// Expense validation rules
export const expenseValidation = {
  create: [
    body("event").notEmpty().withMessage("Event is required").isMongoId().withMessage("Invalid event ID"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isIn([
        "donation",
        "personal_contribution",
        "travel_expense",
        "accommodation",
        "event_material",
        "food_refreshments",
        "miscellaneous",
      ])
      .withMessage("Invalid category"),
    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isFloat({ min: 1 })
      .withMessage("Amount must be greater than 0"),
    body("date").notEmpty().withMessage("Date is required").isISO8601().withMessage("Invalid date format"),
    body("paymentMode")
      .notEmpty()
      .withMessage("Payment mode is required")
      .isIn(["upi", "cash", "bank_transfer", "cheque"])
      .withMessage("Invalid payment mode"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    validate,
  ],

  update: [
    body("category")
      .optional()
      .isIn([
        "donation",
        "personal_contribution",
        "travel_expense",
        "accommodation",
        "event_material",
        "food_refreshments",
        "miscellaneous",
      ])
      .withMessage("Invalid category"),
    body("amount").optional().isFloat({ min: 1 }).withMessage("Amount must be greater than 0"),
    body("paymentMode").optional().isIn(["upi", "cash", "bank_transfer", "cheque"]).withMessage("Invalid payment mode"),
    validate,
  ],
}

// Event validation rules
export const eventValidation = {
  create: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Event name is required")
      .isLength({ max: 200 })
      .withMessage("Event name cannot exceed 200 characters"),
    body("startDate").notEmpty().withMessage("Start date is required").isISO8601().withMessage("Invalid date format"),
    body("endDate")
      .notEmpty()
      .withMessage("End date is required")
      .isISO8601()
      .withMessage("Invalid date format")
      .custom((value, { req }) => new Date(value) >= new Date(req.body.startDate))
      .withMessage("End date must be after start date"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isIn([
        "community_service",
        "professional_development",
        "international_service",
        "club_service",
        "fundraising",
        "social",
        "installation",
        "other",
      ])
      .withMessage("Invalid category"),
    validate,
  ],
}

// Query validation
export const queryValidation = {
  pagination: [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    validate,
  ],

  dateRange: [
    query("startDate").optional().isISO8601().withMessage("Invalid start date format"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date format"),
    validate,
  ],
}

// Param validation
export const paramValidation = {
  mongoId: [param("id").isMongoId().withMessage("Invalid ID format"), validate],
}

export default {
  validate,
  userValidation,
  expenseValidation,
  eventValidation,
  queryValidation,
  paramValidation,
}
