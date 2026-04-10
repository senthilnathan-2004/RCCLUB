// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

import express from "express"
import {
  getHomepage,
  getAboutRotaract,
  getAboutClub,
  getGallery,
  getEventDetails,
  getContact,
  getCurrentBoardPublic,
  getPublicAdmins,
} from "../controllers/public.controller.js"
import { submitContactMessage } from "../controllers/contact.controller.js"

const router = express.Router()

router.get("/homepage", getHomepage)
router.get("/about-rotaract", getAboutRotaract)
router.get("/about-club", getAboutClub)
router.get("/gallery", getGallery)
router.get("/events/:id", getEventDetails)
router.get("/contact", getContact)
router.post("/contact/message", submitContactMessage)
router.get("/board", getCurrentBoardPublic)
router.get("/admins", getPublicAdmins)

export default router
