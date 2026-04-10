// ============================================
// ADMIN USER SYNC UTILITY
// Automatically syncs admin users from .env configuration
// ============================================

import User from "../models/User.model.js"
import ClubSettings from "../models/ClubSettings.model.js"
import { generateMemberId } from "./helpers.js"
import { logger } from "./logger.js"
import config from "../config/config.js"

// Admin roles that should have admin access
const ADMIN_ROLES = ["president", "secretary", "treasurer", "faculty_coordinator"]

/**
 * Sync admin users from environment variables
 * Creates or updates admin users based on .env configuration
 */
export const syncAdminUsers = async () => {
  try {
    logger.info("Starting admin user sync...")

    // Get current rotaract year
    const settings = await ClubSettings.getSettings()
    const currentYear = settings.currentRotaractYear

    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: [],
    }

    // Process each admin role
    for (const role of ADMIN_ROLES) {
      const adminConfig = config.adminUsers[role]

      // Skip if email or password not configured
      const emailValue = adminConfig?.email
      const passwordValue = adminConfig?.password
      
      if (!emailValue || !passwordValue || 
          (typeof emailValue === 'string' && emailValue.trim() === '') ||
          (typeof passwordValue === 'string' && passwordValue.trim() === '')) {
        logger.warn(`Skipping ${role}: email or password not configured in .env`)
        results.skipped.push({
          role,
          reason: "Email or password not configured",
          email: emailValue || "missing",
        })
        continue
      }

      try {
        // Validate email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
        const normalizedEmail = typeof emailValue === 'string' 
          ? emailValue.trim().toLowerCase() 
          : String(emailValue).trim().toLowerCase()
        
        if (!normalizedEmail || normalizedEmail === '' || !emailRegex.test(normalizedEmail)) {
          logger.error(`Invalid email format for ${role}: "${emailValue}" (normalized: "${normalizedEmail}")`)
          results.errors.push({
            role,
            email: emailValue,
            error: `Invalid email format: "${emailValue}"`,
          })
          continue
        }

        // First, try to find user by the new email (in case email hasn't changed)
        let user = await User.findOne({ email: normalizedEmail })

        // If not found by email, try to find by role (for existing admins when email changes)
        if (!user) {
          user = await User.findOne({ role, isAdmin: true })
        }

        if (user) {
          // Keep DB email as source of truth for existing admins.
          // This avoids overwriting approved email changes on restart.
          const emailFromDb = user.email

          // Update existing user profile/role flags from .env (except email/password)
          user.role = role
          user.isAdmin = true
          user.isActive = true
          user.firstName = adminConfig.firstName || user.firstName || role.charAt(0).toUpperCase() + role.slice(1)
          user.lastName = adminConfig.lastName || user.lastName || "Admin"
          user.phone = adminConfig.phone || user.phone || "9999999999"
          user.rotaractYear = currentYear

          // Save with validation
          await user.save({ validateBeforeSave: true })

          logger.info(`Updated admin user: ${role} (${emailFromDb})`)
          results.updated.push({ 
            role, 
            email: emailFromDb,
          })
        } else {
          // Create new user
          const memberId = generateMemberId("RCAIHT")

          user = await User.create({
            memberId,
            email: normalizedEmail,
            password: adminConfig.password,
            firstName: adminConfig.firstName || role.charAt(0).toUpperCase() + role.slice(1),
            lastName: adminConfig.lastName || "Admin",
            phone: adminConfig.phone || "9999999999",
            role,
            isAdmin: true,
            isActive: true,
            rotaractYear: currentYear,
            hasChangedPassword: true, // Mark that password is set
          })

          logger.info(`Created admin user: ${role} (${normalizedEmail})`)
          results.created.push({ role, email: normalizedEmail, memberId })
        }
      } catch (error) {
        logger.error(`Error syncing ${role}: ${error.message}`, error)
        results.errors.push({
          role,
          email: adminConfig.email,
          error: error.message,
        })
      }
    }

    // Remove admin status from users who are no longer in the admin list
    // (but keep them as regular users)
    const configuredRoles = ADMIN_ROLES.filter((role) => {
      const emailValue = config.adminUsers[role]?.email
      const passwordValue = config.adminUsers[role]?.password
      return !!(emailValue && passwordValue)
    })

    const usersToRevoke = await User.find({
      isAdmin: true,
      role: { $in: ADMIN_ROLES, $nin: configuredRoles },
    })

    for (const user of usersToRevoke) {
      user.isAdmin = false
      await user.save()
      logger.info(`Revoked admin status from: ${user.email} (${user.role})`)
      results.updated.push({
        role: user.role,
        email: user.email,
        action: "admin_revoked",
      })
    }

    logger.info("Admin user sync completed", {
      created: results.created.length,
      updated: results.updated.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    })

    return results
  } catch (error) {
    logger.error(`Admin sync error: ${error.message}`)
    throw error
  }
}

export default syncAdminUsers

