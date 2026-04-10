// ============================================
// AUTHENTICATION CONTROLLER
// ============================================

import User from "../models/User.model.js"
import ClubSettings from "../models/ClubSettings.model.js"
import { createAuditLog } from "../middleware/audit.middleware.js"
import config from "../config/config.js"
import { sendEmail, emailTemplates } from "../utils/email.js"
import { generateMemberId } from "../utils/helpers.js"
import { logger } from "../utils/logger.js"
import crypto from "crypto"
import speakeasy from "speakeasy"
import QRCode from "qrcode"

// @desc    Register new member
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, collegeName, courseName } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or phone already exists",
      })
    }

    // Get current rotaract year from settings
    const settings = await ClubSettings.getSettings()

    // Generate unique member ID
    const memberId = generateMemberId("RCAIHT")

    // Create user
    const user = await User.create({
      memberId,
      firstName,
      lastName,
      email,
      phone,
      password,
      collegeName,
      courseName,
      rotaractYear: settings.currentRotaractYear,
    })

    // Generate tokens
    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()
    await user.save()

    // Send welcome email
    const welcomeEmail = emailTemplates.welcome(firstName, memberId)
    sendEmail({
      to: email,
      ...welcomeEmail,
    }).catch(err => logger.error(`Email failed: ${err.message}`))

    // Audit log
    await createAuditLog({
      action: "member_create",
      user,
      targetType: "user",
      targetId: user._id,
      description: "New member registered",
      req,
    })

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          memberId: user.memberId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    })

    // Notify admins via socket
    const io = req.app.get("io")
    if (io) {
      io.to("admins").emit("new_member_registration", {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      })
      io.to("admins").emit("dashboard_update", { reason: "member_registered" })
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    })
  }
}

// @desc    Login member
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, memberId, password, twoFactorCode } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    const user = await User.findOne({ email }).select("+password +twoFactorSecret")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Check if account is locked
    if (user.isLocked()) {
      await createAuditLog({
        action: "failed_login",
        user,
        targetType: "user",
        targetId: user._id,
        description: "Login attempt on locked account",
        req,
      })

      return res.status(423).json({
        success: false,
        message: "Account is locked. Please try again later or contact admin.",
      })
    }

    // Check if user has changed password
    if (user.hasChangedPassword) {
      // User has changed password - must use password login
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required",
        })
      }

      // If memberId is provided but password has been set, reject
      if (memberId) {
        await user.incLoginAttempts()

        await createAuditLog({
          action: "failed_login",
          user,
          targetType: "user",
          targetId: user._id,
          description: "Attempted Member ID login after password change",
          req,
        })

        return res.status(400).json({
          success: false,
          message: "Password has been set. Please login using password credentials.",
        })
      }

      // Verify password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        await user.incLoginAttempts()

        await createAuditLog({
          action: "failed_login",
          user,
          targetType: "user",
          targetId: user._id,
          description: "Invalid password attempt",
          req,
        })

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }
    } else {
      // User hasn't changed password - use memberId login
      if (!memberId) {
        return res.status(400).json({
          success: false,
          message: "Member ID is required",
        })
      }

      // Check if memberId matches (memberId acts as password)
      if (user.memberId !== memberId) {
        await user.incLoginAttempts()

        await createAuditLog({
          action: "failed_login",
          user,
          targetType: "user",
          targetId: user._id,
          description: "Invalid Member ID attempt",
          req,
        })

        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        })
      }
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: "Please enter your 2FA code",
        })
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: twoFactorCode,
        window: 2,
      })

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: "Invalid 2FA code",
        })
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      })
    }

    // Reset login attempts
    user.loginAttempts = 0
    user.lockUntil = undefined
    user.lastLogin = new Date()

    // Generate tokens
    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()
    await user.save()

    // Audit log
    await createAuditLog({
      action: "login",
      user,
      targetType: "user",
      targetId: user._id,
      description: "User logged in",
      req,
    })

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          memberId: user.memberId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          photo: user.photo,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error(`Login error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    })
  }
}

// @desc    Admin login
// @route   POST /api/auth/admin-login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body

    // Get admin user
    const user = await User.findOne({
      email,
      isAdmin: true,
      role: { $in: ["treasurer", "president", "secretary", "joint_secretary"] },
    }).select("+password +twoFactorSecret")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    // Same checks as regular login
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account is locked. Please try again later.",
      })
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      await user.incLoginAttempts()
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    // 2FA check for admin
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: "Please enter your 2FA code",
        })
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: twoFactorCode,
        window: 2,
      })

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: "Invalid 2FA code",
        })
      }
    }

    // Reset login attempts and update last login
    user.loginAttempts = 0
    user.lockUntil = undefined
    user.lastLogin = new Date()

    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()
    await user.save()

    // Audit log
    await createAuditLog({
      action: "login",
      user,
      targetType: "user",
      targetId: user._id,
      description: "Admin logged in",
      req,
    })

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: {
        user: {
          id: user._id,
          memberId: user.memberId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          photo: user.photo,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error(`Admin login error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message,
    })
  }
}

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body

    // Remove refresh token
    if (refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter((t) => t.token !== refreshToken)
      await req.user.save()
    }

    // Audit log
    await createAuditLog({
      action: "logout",
      user: req.user,
      targetType: "user",
      targetId: req.user._id,
      description: "User logged out",
      req,
    })

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    logger.error(`Logout error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Logout failed",
    })
  }
}

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res) => {
  try {
    const user = req.user

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== req.refreshToken)

    // Generate new tokens
    const accessToken = user.generateAuthToken()
    const newRefreshToken = user.generateRefreshToken()
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    })
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    })
  }
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`

    // Send email
    const resetEmail = emailTemplates.passwordReset(user.firstName, resetUrl)
    sendEmail({
      to: user.email,
      ...resetEmail,
    }).catch(err => logger.error(`Email failed: ${err.message}`))

    // Audit log
    await createAuditLog({
      action: "password_reset",
      user,
      targetType: "user",
      targetId: user._id,
      description: "Password reset requested",
      req,
    })

    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
    })
  }
}

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Update password
    user.password = password
    user.hasChangedPassword = true // Mark that user has changed password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.refreshTokens = [] // Invalidate all sessions
    await user.save()

    // Audit log
    await createAuditLog({
      action: "password_change",
      user,
      targetType: "user",
      targetId: user._id,
      description: "Password reset completed",
      req,
    })

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please login with your new password.",
    })
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    })
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id).select("+password")

    // Check if user has changed password before
    if (user.hasChangedPassword) {
      // User has changed password - verify using password
      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }
    } else {
      // User hasn't changed password - verify using Member ID
      if (user.memberId !== currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Member ID is incorrect",
        })
      }
    }

    // Update password
    user.password = newPassword
    user.hasChangedPassword = true // Mark that user has changed password
    user.refreshTokens = [] // Invalidate all other sessions
    await user.save()

    // Generate new tokens
    const accessToken = user.generateAuthToken()
    const refreshToken = user.generateRefreshToken()
    await user.save()

    // Audit log
    await createAuditLog({
      action: "password_change",
      user,
      targetType: "user",
      targetId: user._id,
      description: "Password changed",
      req,
    })

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    logger.error(`Change password error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Password change failed",
    })
  }
}

// @desc    Setup 2FA
// @route   POST /api/auth/setup-2fa
// @access  Private
export const setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "2FA is already enabled",
      })
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `RotaractClub (${user.email})`,
      length: 20,
    })

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url)

    // Store secret temporarily (will be confirmed on verify)
    user.twoFactorSecret = secret.base32
    await user.save()

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode,
      },
    })
  } catch (error) {
    logger.error(`2FA setup error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "2FA setup failed",
    })
  }
}

// @desc    Verify and enable 2FA
// @route   POST /api/auth/verify-2fa
// @access  Private
export const verify2FA = async (req, res) => {
  try {
    const { code } = req.body

    const user = await User.findById(req.user._id).select("+twoFactorSecret")

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "Please setup 2FA first",
      })
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2,
    })

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      })
    }

    // Enable 2FA
    user.twoFactorEnabled = true
    await user.save()

    // Audit log
    await createAuditLog({
      action: "two_factor_enable",
      user,
      targetType: "user",
      targetId: user._id,
      description: "2FA enabled",
      req,
    })

    res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
    })
  } catch (error) {
    logger.error(`2FA verify error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "2FA verification failed",
    })
  }
}

// @desc    Disable 2FA
// @route   POST /api/auth/disable-2fa
// @access  Private
export const disable2FA = async (req, res) => {
  try {
    const { password, code } = req.body

    const user = await User.findById(req.user._id).select("+password +twoFactorSecret")

    // Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      })
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
      window: 2,
    })

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid 2FA code",
      })
    }

    // Disable 2FA
    user.twoFactorEnabled = false
    user.twoFactorSecret = undefined
    await user.save()

    // Audit log
    await createAuditLog({
      action: "two_factor_disable",
      user,
      targetType: "user",
      targetId: user._id,
      description: "2FA disabled",
      req,
    })

    res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    })
  } catch (error) {
    logger.error(`2FA disable error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "2FA disable failed",
    })
  }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    logger.error(`Get me error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get user data",
    })
  }
}

// @desc    Check login status (hasChangedPassword)
// @route   GET /api/auth/check-login-status
// @access  Public
export const checkLoginStatus = async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        data: {
          exists: false,
          hasChangedPassword: false,
        },
      })
    }

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        hasChangedPassword: user.hasChangedPassword || false,
      },
    })
  } catch (error) {
    logger.error(`Check login status error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to check login status",
    })
  }
}

// @desc    Request email change (admin/member self-service with approval)
// @route   POST /api/auth/email-change/request
// @access  Private
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body

    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New email and current password are required",
      })
    }

    const normalizedEmail = String(newEmail).toLowerCase().trim()

    if (normalizedEmail === req.user.email) {
      return res.status(400).json({
        success: false,
        message: "New email must be different from current email",
      })
    }

    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This email is already in use",
      })
    }

    const user = await User.findById(req.user._id).select("+password")
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    user.emailChangeRequest = {
      newEmail: normalizedEmail,
      token: hashedToken,
      expiresAt,
      requestedAt: new Date(),
    }
    await user.save()

    const approvalUrl = `${config.frontendUrl}/approve-email-change?token=${rawToken}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Approve Email Change</h2>
        <p>Hello ${user.firstName},</p>
        <p>We received a request to change your account email.</p>
        <p><strong>Current email:</strong> ${user.email}</p>
        <p><strong>Requested new email:</strong> ${normalizedEmail}</p>
        <p>Click below to approve this change:</p>
        <a href="${approvalUrl}" style="display:inline-block;padding:10px 18px;background:#0066cc;color:#fff;text-decoration:none;border-radius:6px;">Approve Email Change</a>
        <p style="margin-top:16px;color:#666;">This link expires in 30 minutes. If you did not request this, ignore this email.</p>
      </div>
    `

    await sendEmail({
      to: user.email,
      subject: "Approve your email change request",
      html: emailHtml,
      text: `Approve your email change: ${approvalUrl}`,
    })

    return res.status(200).json({
      success: true,
      message: "Approval link sent to your current email",
    })
  } catch (error) {
    logger.error(`Request email change error: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Failed to request email change",
    })
  }
}

// @desc    Approve email change by token
// @route   POST /api/auth/email-change/approve
// @access  Public
export const approveEmailChange = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Approval token is required",
      })
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const user = await User.findOne({
      "emailChangeRequest.token": hashedToken,
      "emailChangeRequest.expiresAt": { $gt: new Date() },
    })

    if (!user || !user.emailChangeRequest?.newEmail) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired approval link",
      })
    }

    const targetEmail = user.emailChangeRequest.newEmail
    const conflict = await User.findOne({ email: targetEmail, _id: { $ne: user._id } })
    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Requested email is already used by another account",
      })
    }

    const oldEmail = user.email
    user.email = targetEmail
    user.emailChangeRequest = undefined
    await user.save()

    await createAuditLog({
      action: "profile_update",
      user,
      targetType: "user",
      targetId: user._id,
      description: `Email changed from ${oldEmail} to ${targetEmail}`,
      req,
    })

    return res.status(200).json({
      success: true,
      message: "Email changed successfully. Please login again with your new email.",
    })
  } catch (error) {
    logger.error(`Approve email change error: ${error.message}`)
    return res.status(500).json({
      success: false,
      message: "Failed to approve email change",
    })
  }
}

export default {
  register,
  login,
  adminLogin,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  getMe,
  checkLoginStatus,
  requestEmailChange,
  approveEmailChange,
}

