// ============================================
// SETTINGS CONTROLLER
// ============================================

import ClubSettings from "../models/ClubSettings.model.js"
import { createAuditLog } from "../middleware/audit.middleware.js"
import { deleteFile } from "../utils/helpers.js"
import { logger } from "../utils/logger.js"

// @desc    Get club settings
// @route   GET /api/settings
// @access  Public (some fields) / Private (all fields)
export const getSettings = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    // If not authenticated, return only public fields
    if (!req.user) {
      const publicSettings = {
        clubName: settings.clubName,
        parentClubName: settings.parentClubName,
        collegeName: settings.collegeName,
        rid: settings.rid,
        currentRotaractYear: settings.currentRotaractYear,
        themeOfYear: settings.themeOfYear,
        clubLogo: settings.clubLogo,
        rotaractLogo: settings.rotaractLogo,
        parentClubLogo: settings.parentClubLogo,
        collegeLogo: settings.collegeLogo,
        aboutRotaract: settings.aboutRotaract,
        missionStatement: settings.missionStatement,
        visionStatement: settings.visionStatement,
        aboutClubDescription: settings.aboutClubDescription,
        homeHeroTitle: settings.homeHeroTitle,
        homeHeroSubtitle: settings.homeHeroSubtitle,
        homeHeroDescription: settings.homeHeroDescription,
        contactDescription: settings.contactDescription,
        socialMedia: settings.socialMedia,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        meetingSchedule: settings.meetingSchedule,
        statsActiveMembers: settings.statsActiveMembers,
        statsEventsThisYear: settings.statsEventsThisYear,
        statsServiceHours: settings.statsServiceHours,
        statsYearsOfService: settings.statsYearsOfService,
        legacyProjectsCompleted: settings.legacyProjectsCompleted,
        legacyAlumniMembers: settings.legacyAlumniMembers,
        legacyLivesImpacted: settings.legacyLivesImpacted,
        establishedYear: settings.establishedYear,
        joinCommunityText: settings.joinCommunityText,
        achievements: settings.achievements,
        areasOfFocus: settings.areasOfFocus,
      }

      return res.status(200).json({
        success: true,
        data: publicSettings,
      })
    }

    res.status(200).json({
      success: true,
      data: settings,
    })
  } catch (error) {
    logger.error(`Get settings error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get settings",
    })
  }
}

// @desc    Update club settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    const allowedUpdates = [
      "clubName",
      "parentClubName",
      "collegeName",
      "rid",
      "currentRotaractYear",
      "yearStartDate",
      "yearEndDate",
      "themeOfYear",
      "primaryColor",
      "secondaryColor",
      "aboutRotaract",
      "missionStatement",
      "visionStatement",
      "clubHistory",
      "aboutClubDescription",
      "homeHeroTitle",
      "homeHeroSubtitle",
      "homeHeroDescription",
      "contactDescription",
      "contactEmail",
      "contactPhone",
      "address",
      "meetingSchedule",
      "socialMedia",
      "features",
      "statsActiveMembers",
      "statsEventsThisYear",
      "statsServiceHours",
      "statsYearsOfService",
      "legacyProjectsCompleted",
      "legacyAlumniMembers",
      "legacyLivesImpacted",
      "establishedYear",
      "joinCommunityText",
      "achievements",
      "areasOfFocus",
    ]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    // Handle logo uploads
    if (req.files) {
      if (req.files.clubLogo) {
        if (settings.clubLogo) deleteFile(settings.clubLogo)
        updates.clubLogo = `/uploads/logos/${req.files.clubLogo[0].filename}`
      }
      if (req.files.rotaractLogo) {
        if (settings.rotaractLogo) deleteFile(settings.rotaractLogo)
        updates.rotaractLogo = `/uploads/logos/${req.files.rotaractLogo[0].filename}`
      }
      if (req.files.parentClubLogo) {
        if (settings.parentClubLogo) deleteFile(settings.parentClubLogo)
        updates.parentClubLogo = `/uploads/logos/${req.files.parentClubLogo[0].filename}`
      }
      if (req.files.collegeLogo) {
        if (settings.collegeLogo) deleteFile(settings.collegeLogo)
        updates.collegeLogo = `/uploads/logos/${req.files.collegeLogo[0].filename}`
      }
    }

    Object.assign(settings, updates)
    await settings.save()

    // Audit log
    await createAuditLog({
      action: "settings_update",
      user: req.user,
      targetType: "settings",
      targetId: settings._id,
      description: "Club settings updated",
      changes: updates,
      req,
    })

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    })
  } catch (error) {
    logger.error(`Update settings error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    })
  }
}

// @desc    Update logos
// @route   PUT /api/settings/logos
// @access  Private/Admin
export const updateLogos = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one logo",
      })
    }

    const updates = {}

    if (req.files.clubLogo) {
      if (settings.clubLogo) deleteFile(settings.clubLogo)
      updates.clubLogo = `/uploads/logos/${req.files.clubLogo[0].filename}`
    }
    if (req.files.rotaractLogo) {
      if (settings.rotaractLogo) deleteFile(settings.rotaractLogo)
      updates.rotaractLogo = `/uploads/logos/${req.files.rotaractLogo[0].filename}`
    }
    if (req.files.parentClubLogo) {
      if (settings.parentClubLogo) deleteFile(settings.parentClubLogo)
      updates.parentClubLogo = `/uploads/logos/${req.files.parentClubLogo[0].filename}`
    }
    if (req.files.collegeLogo) {
      if (settings.collegeLogo) deleteFile(settings.collegeLogo)
      updates.collegeLogo = `/uploads/logos/${req.files.collegeLogo[0].filename}`
    }

    Object.assign(settings, updates)
    await settings.save()

    res.status(200).json({
      success: true,
      message: "Logos updated successfully",
      data: {
        clubLogo: settings.clubLogo,
        rotaractLogo: settings.rotaractLogo,
        parentClubLogo: settings.parentClubLogo,
        collegeLogo: settings.collegeLogo,
      },
    })
  } catch (error) {
    logger.error(`Update logos error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to update logos",
    })
  }
}

export default {
  getSettings,
  updateSettings,
  updateLogos,
}
