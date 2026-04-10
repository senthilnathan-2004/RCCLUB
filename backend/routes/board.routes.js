// ============================================
// BOARD ROUTES
// ============================================

import express from "express"
import {
  getCurrentBoard,
  getBoardByYear,
  createOrUpdateBoard,
  updateBoardMember,
  getBoardHistory,
} from "../controllers/board.controller.js"
import { protect, adminOnly } from "../middleware/auth.middleware.js"
import { uploadPhoto, upload } from "../middleware/upload.middleware.js"

const router = express.Router()

// Public routes
router.get("/", getCurrentBoard)
router.get("/history", getBoardHistory)
router.get("/:year", getBoardByYear)

// Admin routes
router.use(protect)
router.use(adminOnly)

router.post(
  "/",
  upload.fields([
    { name: "boardPhoto", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  createOrUpdateBoard,
)
router.put("/member", uploadPhoto, updateBoardMember)

export default router
