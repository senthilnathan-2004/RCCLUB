import express from "express"
import { uploadGalleryImage, getPublicGalleryImages, deleteGalleryImage } from "../controllers/gallery.controller.js"
import { protect, adminOnly } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/upload.middleware.js"

const router = express.Router()

// Public route to get general gallery images
router.get("/public", getPublicGalleryImages)

// Admin routes for managing images
router.use(protect)
router.use(adminOnly)
router.post("/upload", upload.single("gallery"), uploadGalleryImage)
router.delete("/:id", deleteGalleryImage)

export default router
