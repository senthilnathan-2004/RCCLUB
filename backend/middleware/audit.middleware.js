// ============================================
// AUDIT LOGGING MIDDLEWARE
// ============================================

import AuditLog from "../models/AuditLog.model.js"
import ClubSettings from "../models/ClubSettings.model.js"
import { logger } from "../utils/logger.js"

// Create audit log
export const createAuditLog = async ({ action, user, targetType, targetId, description, changes, req }) => {
  try {
    const settings = await ClubSettings.getSettings()
    await AuditLog.create({
      action,
      user: user?._id,
      userEmail: user?.email,
      userRole: user?.role,
      targetType,
      targetId,
      description,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.["user-agent"],
      rotaractYear: settings.currentRotaractYear,
    })
  } catch (error) {
    logger.error(`Audit log error: ${error.message}`)
  }
}

// Audit middleware for routes
export const auditAction = (action, targetType) => {
  return async (req, res, next) => {
    // Store original send
    const originalSend = res.send

    res.send = function (body) {
      // Parse response
      let responseBody
      try {
        responseBody = typeof body === "string" ? JSON.parse(body) : body
      } catch {
        responseBody = body
      }

      // Log if successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog({
          action,
          user: req.user,
          targetType,
          targetId: req.params.id || responseBody?.data?._id,
          description: `${action} performed`,
          changes: req.body,
          req,
        })
      }

      return originalSend.call(this, body)
    }

    next()
  }
}

export default { createAuditLog, auditAction }
