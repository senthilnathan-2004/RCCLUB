// ============================================
// HELPER UTILITIES
// ============================================

import crypto from "crypto"
import CryptoJS from "crypto-js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate random token
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex")
}

// Generate member ID
export const generateMemberId = (prefix = "RC") => {
  const year = new Date().getFullYear().toString().slice(-2)
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${year}${random}`
}

// Encrypt sensitive data
export const encryptData = (data, secretKey) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString()
}

// Decrypt sensitive data
export const decryptData = (encryptedData, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

// Format currency (INR)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

// Calculate financial year
export const getFinancialYear = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth()

  if (month >= 6) {
    // July onwards (Rotaract year starts July 1)
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

// Sanitize filename
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
}

// Paginate results
export const deleteFile = (fileUrl) => {
  if (!fileUrl) return
  // Don't delete URLs that are external (like default avatars from dicebear or google)
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return
  try {
    // URL usually starts with /uploads, so we join it with the backend root
    const filePath = path.join(__dirname, "..", fileUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`Failed to delete file ${fileUrl}:`, error.message)
  }
}

export const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, Number.parseInt(page))
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  return { skip, limit: limitNum, page: pageNum }
}

// Build pagination response
export const paginationResponse = (total, page, limit) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  }
}

export default {
  generateToken,
  generateMemberId,
  encryptData,
  decryptData,
  formatCurrency,
  getFinancialYear,
  sanitizeFilename,
  paginate,
  paginationResponse,
  deleteFile,
}
