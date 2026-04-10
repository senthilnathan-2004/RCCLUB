// ============================================
// ARCHIVE MODEL
// ============================================

import mongoose from "mongoose"

const archiveSchema = new mongoose.Schema(
  {
    // Year
    rotaractYear: {
      type: String,
      required: true,
      unique: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "closed", "archived"],
      default: "active",
    },
    closedAt: Date,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Summary Data
    summary: {
      totalMembers: { type: Number, default: 0 },
      totalEvents: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 },
      totalContributions: { type: Number, default: 0 },
      totalReimbursements: { type: Number, default: 0 },
    },

    // Files
    files: [
      {
        name: String,
        type: { type: String, enum: ["financial_report", "member_list", "event_report", "bills_archive", "other"] },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Board Info (snapshot)
    boardSnapshot: {
      president: String,
      secretary: String,
      treasurer: String,
      theme: String,
    },

    // Notes
    notes: String,
  },
  {
    timestamps: true,
  },
)

// Index
archiveSchema.index({ rotaractYear: 1 })

const Archive = mongoose.model("Archive", archiveSchema)

export default Archive
