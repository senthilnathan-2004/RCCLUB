// ============================================
// ADMIN ROUTES
// ============================================

import express from "express"
import {
  getDashboard,
  getMembers,
  getMemberById,
  addMember,
  updateMember,
  changeMemberRole,
  markAsAlumni,
  deleteMember,
  getMembersDropdown,
} from "../controllers/admin.controller.js"
import { getContactMessages, replyToContactMessage, deleteContactMessage } from "../controllers/contact.controller.js"
import { protect, adminOnly, authorize } from "../middleware/auth.middleware.js"
import { userValidation, queryValidation, paramValidation } from "../middleware/validation.middleware.js"

const router = express.Router()

// All routes require authentication and admin access
router.use(protect)
router.use(adminOnly)

router.get("/dashboard", getDashboard)
router.get("/members", queryValidation.pagination, getMembers)
router.get("/members/dropdown", getMembersDropdown)
router.get("/members/:id", paramValidation.mongoId, getMemberById)
router.post("/members", userValidation.addMember, addMember)
router.put("/members/:id", paramValidation.mongoId, updateMember)
router.put("/members/:id/role", authorize("president"), changeMemberRole)
router.put("/members/:id/alumni", markAsAlumni)
router.delete("/members/:id", authorize("president", "secretary"), deleteMember)
router.get("/messages", getContactMessages)
router.post("/messages/:id/reply", paramValidation.mongoId, replyToContactMessage)
router.delete("/messages/:id", paramValidation.mongoId, deleteContactMessage)

export default router
