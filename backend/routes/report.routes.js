// ============================================
// REPORT ROUTES
// ============================================

import express from "express"
import {
  getFinancialSummary,
  getMemberWiseReport,
  getEventWiseReport,
  exportPDF,
  exportExcel,
  exportBillsZip,
  getLeaderboard,
} from "../controllers/report.controller.js"
import { protect, adminOnly } from "../middleware/auth.middleware.js"

const router = express.Router()

// All routes require authentication
router.use(protect)

// Leaderboard is available to all members
router.get("/leaderboard", getLeaderboard)

// Admin only routes
router.use(adminOnly)

router.get("/financial-summary", getFinancialSummary)
router.get("/member-wise", getMemberWiseReport)
router.get("/event-wise", getEventWiseReport)
router.get("/export/pdf", exportPDF)
router.get("/export/excel", exportExcel)
router.get("/export/bills", exportBillsZip)

export default router
