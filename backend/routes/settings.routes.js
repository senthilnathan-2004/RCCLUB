// ============================================
// SETTINGS ROUTES
// ============================================

import express from "express"
import { getSettings, updateSettings, updateLogos } from "../controllers/settings.controller.js"
import { protect, adminOnly } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

// Public route (returns limited data)
router.get("/", getSettings)

// Admin routes
router.use(protect)
router.use(adminOnly)

router.put(
  "/",
  upload.fields([
    { name: "clubLogo", maxCount: 1 },
    { name: "rotaractLogo", maxCount: 1 },
    { name: "parentClubLogo", maxCount: 1 },
    { name: "collegeLogo", maxCount: 1 },
  ]),
  updateSettings,
)

router.put(
  "/logos",
  upload.fields([
    { name: "clubLogo", maxCount: 1 },
    { name: "rotaractLogo", maxCount: 1 },
    { name: "parentClubLogo", maxCount: 1 },
    { name: "collegeLogo", maxCount: 1 },
  ]),
  updateLogos,
)

export default router
