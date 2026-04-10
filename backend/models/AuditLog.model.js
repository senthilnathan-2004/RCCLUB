// ============================================
// AUDIT LOG MODEL
// ============================================

import mongoose from "mongoose"

const auditLogSchema = new mongoose.Schema(
  {
    // Action
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "password_change",
        "password_reset",
        "profile_update",
        "expense_create",
        "expense_update",
        "expense_approve",
        "expense_reject",
        "expense_reimburse",
        "expense_delete",
        "member_create",
        "member_update",
        "member_delete",
        "member_role_change",
        "event_create",
        "event_update",
        "event_delete",
        "settings_update",
        "board_update",
        "year_close",
        "archive_create",
        "two_factor_enable",
        "two_factor_disable",
        "failed_login",
      ],
    },

    // Actor
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: String,
    userRole: String,

    // Target
    targetType: {
      type: String,
      enum: ["user", "expense", "event", "settings", "board", "archive"],
    },
    targetId: mongoose.Schema.Types.ObjectId,

    // Details
    description: String,
    changes: mongoose.Schema.Types.Mixed, // Store before/after values

    // Request Info
    ipAddress: String,
    userAgent: String,

    // Metadata
    rotaractYear: String,
  },
  {
    timestamps: true,
  },
)

// Indexes
auditLogSchema.index({ action: 1 })
auditLogSchema.index({ user: 1 })
auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ rotaractYear: 1 })

// TTL index - auto-delete logs older than 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 })

const AuditLog = mongoose.model("AuditLog", auditLogSchema)

export default AuditLog
