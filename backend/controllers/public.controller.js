// ============================================
// PUBLIC CONTROLLER (No Auth Required)
// ============================================

import ClubSettings from "../models/ClubSettings.model.js"
import Board from "../models/Board.model.js"
import Event from "../models/Event.model.js"
import User from "../models/User.model.js"
import { getFinancialYear } from "../utils/helpers.js"
import { logger } from "../utils/logger.js"

// @desc    Get public homepage data
// @route   GET /api/public/homepage
// @access  Public
export const getHomepage = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()
    const currentYear = settings.currentRotaractYear

    // Get current board
    const board = await Board.findOne({ rotaractYear: currentYear, isActive: true }).select("theme members boardPhoto")

    // Get upcoming events
    const upcomingEvents = await Event.find({
      rotaractYear: currentYear,
      status: { $in: ["upcoming", "ongoing"] },
      isArchived: false,
    })
      .select("name startDate endDate category coverImage venue")
      .sort({ startDate: 1 })
      .limit(5)

    // Get recent completed events
    const recentEvents = await Event.find({
      rotaractYear: currentYear,
      status: "completed",
      isArchived: false,
    })
      .select("name startDate category coverImage gallery")
      .sort({ endDate: -1 })
      .limit(6)

    res.status(200).json({
      success: true,
      data: {
        club: {
          name: settings.clubName,
          parentClub: settings.parentClubName,
          college: settings.collegeName,
          rid: settings.rid,
          currentYear: settings.currentRotaractYear,
          theme: settings.themeOfYear,
          logos: {
            club: settings.clubLogo,
            rotaract: settings.rotaractLogo,
            parentClub: settings.parentClubLogo,
            college: settings.collegeLogo,
          },
          mission: settings.missionStatement,
          vision: settings.visionStatement,
          about: settings.aboutRotaract,
          contact: {
            email: settings.contactEmail,
            phone: settings.contactPhone,
            address: settings.address,
          },
          socialMedia: settings.socialMedia,
        },
        board: board
          ? {
            theme: board.theme,
            photo: board.boardPhoto,
            president: board.members.find((m) => m.position === "president"),
            secretary: board.members.find((m) => m.position === "secretary"),
            treasurer: board.members.find((m) => m.position === "treasurer"),
          }
          : null,
        upcomingEvents,
        recentEvents,
      },
    })
  } catch (error) {
    logger.error(`Homepage error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load homepage data",
    })
  }
}

// @desc    Get about Rotaract page
// @route   GET /api/public/about-rotaract
// @access  Public
export const getAboutRotaract = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    res.status(200).json({
      success: true,
      data: {
        aboutRotaract: settings.aboutRotaract,
        mission: settings.missionStatement,
        vision: settings.visionStatement,
      },
    })
  } catch (error) {
    logger.error(`About Rotaract error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load about page",
    })
  }
}

// @desc    Get about club page
// @route   GET /api/public/about-club
// @access  Public
export const getAboutClub = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    // Get past boards (presidents, treasurers)
    const pastBoards = await Board.find({ isActive: false })
      .select("rotaractYear theme members installationDate boardPhoto")
      .sort({ rotaractYear: -1 })

    const pastPresidents = pastBoards
      .map((board) => ({
        year: board.rotaractYear,
        president: board.members.find((m) => m.position === "president"),
        theme: board.theme,
      }))
      .filter((b) => b.president)

    const pastTreasurers = pastBoards
      .map((board) => ({
        year: board.rotaractYear,
        treasurer: board.members.find((m) => m.position === "treasurer"),
      }))
      .filter((b) => b.treasurer)

    res.status(200).json({
      success: true,
      data: {
        clubName: settings.clubName,
        history: settings.clubHistory,
        pastPresidents,
        pastTreasurers,
        pastBoards: pastBoards.map((b) => ({
          year: b.rotaractYear,
          theme: b.theme,
          photo: b.boardPhoto,
        })),
      },
    })
  } catch (error) {
    logger.error(`About club error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load about club page",
    })
  }
}

// @desc    Get events gallery
// @route   GET /api/public/gallery
// @access  Public
export const getGallery = async (req, res) => {
  try {
    const { year, category, page = 1, limit = 12 } = req.query

    // Build query
    const query = { isArchived: false }
    if (year) query.rotaractYear = year
    if (category) query.category = category

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    const [events, total, years] = await Promise.all([
      Event.find(query)
        .select("name description startDate endDate category coverImage gallery status rotaractYear venue attendees tags")
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(Number.parseInt(limit)),
      Event.countDocuments(query),
      Event.distinct("rotaractYear"),
    ])

    res.status(200).json({
      success: true,
      data: {
        events,
        availableYears: years.sort().reverse(),
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(total / Number.parseInt(limit)),
        },
      },
    })
  } catch (error) {
    logger.error(`Gallery error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load gallery",
    })
  }
}

// @desc    Get single event details (public)
// @route   GET /api/public/events/:id
// @access  Public
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select(
      "name description startDate endDate category venue coverImage gallery videoLinks reportLink attendees status",
    )

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    logger.error(`Event details error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load event details",
    })
  }
}

// @desc    Get contact info
// @route   GET /api/public/contact
// @access  Public
export const getContact = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    res.status(200).json({
      success: true,
      data: {
        email: settings.contactEmail,
        phone: settings.contactPhone,
        address: settings.address,
        socialMedia: settings.socialMedia,
      },
    })
  } catch (error) {
    logger.error(`Contact error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load contact info",
    })
  }
}

// @desc    Get current board (public)
// @route   GET /api/public/board
// @access  Public
export const getCurrentBoardPublic = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()
    const currentYear = settings.currentRotaractYear

    const board = await Board.findOne({ rotaractYear: currentYear, isActive: true })

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board information not available",
      })
    }

    res.status(200).json({
      success: true,
      data: {
        rotaractYear: board.rotaractYear,
        theme: board.theme,
        themeDescription: board.themeDescription,
        members: board.members,
        boardPhoto: board.boardPhoto,
        bannerImage: board.bannerImage,
        installationDate: board.installationDate,
      },
    })
  } catch (error) {
    logger.error(`Public board error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load board information",
    })
  }
}

// @desc    Get active admins
// @route   GET /api/public/admins
// @access  Public
export const getPublicAdmins = async (req, res) => {
  try {
    // Only fetch users who are marked as isAdmin and active
    const admins = await User.find({ isAdmin: true, isActive: true })
      .select("firstName lastName email phone role photo")
      .limit(10)

    res.status(200).json({
      success: true,
      data: admins.map((admin) => ({
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        phone: admin.phone,
        position: admin.role,
        photo: admin.photo,
      })),
    })
  } catch (error) {
    logger.error(`Public admins error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load admins",
    })
  }
}

export default {
  getHomepage,
  getAboutRotaract,
  getAboutClub,
  getGallery,
  getEventDetails,
  getContact,
  getCurrentBoardPublic,
  getPublicAdmins,
}
