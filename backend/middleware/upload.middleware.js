// ============================================
// FILE UPLOAD MIDDLEWARE
// ============================================

import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import crypto from "crypto"
import config from "../config/config.js"
import { AppError } from "./error.middleware.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, "../uploads")

    // Organize by type
    if (file.fieldname === "bill") {
      uploadPath = path.join(uploadPath, "bills")
    } else if (file.fieldname === "photo") {
      uploadPath = path.join(uploadPath, "photos")
    } else if (file.fieldname === "logo" || file.fieldname.toLowerCase().includes("logo")) {
      uploadPath = path.join(uploadPath, "logos")
    } else if (file.fieldname === "gallery") {
      uploadPath = path.join(uploadPath, "gallery")
    }

    // Ensure the upload directory exists
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        cb(err, uploadPath)
      } else {
        cb(null, uploadPath)
      }
    })
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString("hex")
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = config.allowedFileTypes

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false)
  }
}

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize, // 5MB
    files: 5,
  },
})

// Upload middleware for different types
export const uploadBill = upload.single("bill")
export const uploadPhoto = upload.single("photo")
export const uploadLogo = upload.single("logo")
export const uploadGallery = upload.array("gallery", 10)
export const uploadMultiple = upload.fields([
  { name: "bill", maxCount: 1 },
  { name: "photo", maxCount: 1 },
])

// Memory storage for processing
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
})

export default {
  upload,
  uploadBill,
  uploadPhoto,
  uploadLogo,
  uploadGallery,
  uploadMultiple,
  memoryUpload,
}
