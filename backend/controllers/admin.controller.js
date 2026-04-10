// ============================================
// ADMIN CONTROLLER
// ============================================

import User, { USER_ROLES } from "../models/User.model.js"
import Expense from "../models/Expense.model.js"
import Event from "../models/Event.model.js"
import Board from "../models/Board.model.js"
import { createAuditLog } from "../middleware/audit.middleware.js"
import { sendEmail, emailTemplates } from "../utils/email.js"
import { generateMemberId, paginate, paginationResponse, getFinancialYear, deleteFile } from "../utils/helpers.js"
import { logger } from "../utils/logger.js"
import ClubSettings from "../models/ClubSettings.model.js"

const ADMIN_ROLES = ["president", "secretary", "treasurer", "faculty_coordinator"]

// @desc    Get admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboard = async (req, res) => {
  try {
    const settings = await ClubSettings.getSettings()
    const currentYear = settings.currentRotaractYear

    // Get summary statistics
    const [
      totalMembers,
      totalEvents,
      expensesSummary,
      monthlyExpenses,
      expensesByCategory,
      topContributors,
      recentExpenses,
    ] = await Promise.all([
      // Total active members
      User.countDocuments({ isActive: true, isAlumni: false }),

      // Total events this year
      Event.countDocuments({ rotaractYear: currentYear }),

      // Expenses summary
      Expense.aggregate([
        { $match: { rotaractYear: currentYear } },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Monthly expenses trend
      Expense.aggregate([
        { $match: { rotaractYear: currentYear } },
        {
          $group: {
            _id: { $month: "$date" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Expenses by category
      Expense.aggregate([
        { $match: { rotaractYear: currentYear } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Top contributors
      Expense.aggregate([
        {
          $match: {
            rotaractYear: currentYear,
            status: { $in: ["approved", "reimbursed", "paid"] },
          },
        },
        {
          $group: {
            _id: "$member",
            totalContribution: { $sum: "$amount" },
            expenseCount: { $sum: 1 },
          },
        },
        { $sort: { totalContribution: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "member",
          },
        },
        { $unwind: "$member" },
        {
          $project: {
            _id: 1,
            totalContribution: 1,
            expenseCount: 1,
            "member.firstName": 1,
            "member.lastName": 1,
            "member.memberId": 1,
            "member.photo": 1,
          },
        },
      ]),

      // Recent expenses
      Expense.find({ rotaractYear: currentYear })
        .populate("member", "firstName lastName")
        .populate("event", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ])

    // Calculate totals
    const summary = {
      totalMembers,
      totalEvents,
      totalSpending: 0,
      totalContributions: 0,
      pendingReimbursements: 0,
      pendingCount: 0,
    }

    expensesSummary.forEach((item) => {
      summary.totalSpending += item.total
      if (item._id === "pending") {
        summary.pendingReimbursements = item.total
        summary.pendingCount = item.count
      }
      if (["approved", "reimbursed", "paid"].includes(item._id)) {
        summary.totalContributions += item.total
      }
    })

    res.status(200).json({
      success: true,
      data: {
        rotaractYear: currentYear,
        summary,
        monthlyExpenses,
        expensesByCategory,
        topContributors,
        recentExpenses,
        expensesByStatus: expensesSummary,
      },
    })
  } catch (error) {
    logger.error(`Admin dashboard error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    })
  }
}

// @desc    Get all members
// @route   GET /api/admin/members
// @access  Private/Admin
export const getMembers = async (req, res) => {
  try {
    const { page, limit } = paginate(req.query.page, req.query.limit)
    const { role, isActive, isAlumni, search, rotaractYear } = req.query

    // Build query
    const query = {}

    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === "true"
    if (isAlumni !== undefined) query.isAlumni = isAlumni === "true"
    if (rotaractYear) query.rotaractYear = rotaractYear
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ]
    }

    const [members, total] = await Promise.all([
      User.find(query)
        .select("-password -twoFactorSecret -refreshTokens")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ])

    res.status(200).json({
      success: true,
      data: members,
      pagination: paginationResponse(total, page, limit),
    })
  } catch (error) {
    logger.error(`Get members error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get members",
    })
  }
}

// @desc    Get member by ID
// @route   GET /api/admin/members/:id
// @access  Private/Admin
export const getMemberById = async (req, res) => {
  try {
    const member = await User.findById(req.params.id).select("-password -twoFactorSecret -refreshTokens")

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      })
    }

    // Get member's expense summary
    const expensesSummary = await Expense.aggregate([
      { $match: { member: member._id } },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ])

    res.status(200).json({
      success: true,
      data: {
        member,
        expensesSummary,
      },
    })
  } catch (error) {
    logger.error(`Get member error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get member",
    })
  }
}

// @desc    Add new member
// @route   POST /api/admin/members
// @access  Private/Admin
export const addMember = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, collegeName, courseName, dateOfBirth, address } =
      req.body

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or phone already exists",
      })
    }

    let assignedRole = "member"
    if (role) {
      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selection",
        })
      }

      if (ADMIN_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Admin roles can only be assigned through the admin onboarding flow",
        })
      }

      assignedRole = role
    }

    // Get current rotaract year
    const settings = await ClubSettings.getSettings()

    // Generate member ID
    const memberId = generateMemberId("RCAIHT")

    // Determine if admin based on role
    const isAdmin = ADMIN_ROLES.includes(assignedRole)

    const member = await User.create({
      memberId,
      firstName,
      lastName,
      email,
      phone,
      password: password || "Rotaract@123", // Default password
      role: assignedRole,
      isAdmin,
      collegeName,
      courseName,
      dateOfBirth,
      address,
      rotaractYear: settings.currentRotaractYear,
    })

    // Send welcome email with login credentials
    const defaultPassword = password || "Rotaract@123"
    const welcomeEmail = emailTemplates.welcome(firstName, memberId, defaultPassword)
    sendEmail({
      to: email,
      ...welcomeEmail,
    }).catch(err => logger.error(`Email failed: ${err.message}`))

    // Audit log
    await createAuditLog({
      action: "member_create",
      user: req.user,
      targetType: "user",
      targetId: member._id,
      description: `New member added: ${firstName} ${lastName}`,
      req,
    })

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    })
  } catch (error) {
    logger.error(`Add member error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to add member",
      error: error.message,
    })
  }
}

// @desc    Update member
// @route   PUT /api/admin/members/:id
// @access  Private/Admin
export const updateMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      })
    }

    const allowedUpdates = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "address",
      "collegeName",
      "courseName",
      "designation",
      "isActive",
      "role",
    ]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    // If role is being updated, validate and sync admin flags
    if (updates.role) {
      if (!USER_ROLES.includes(updates.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selection",
        })
      }
      updates.isAdmin = ADMIN_ROLES.includes(updates.role)
      updates.isAlumni = updates.role === "alumni"
    }

    const updatedMember = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -twoFactorSecret -refreshTokens")

    // Audit log
    await createAuditLog({
      action: "member_update",
      user: req.user,
      targetType: "user",
      targetId: member._id,
      description: `Member updated: ${member.fullName}`,
      changes: updates,
      req,
    })

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: updatedMember,
    })
  } catch (error) {
    logger.error(`Update member error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to update member",
    })
  }
}

// @desc    Change member role
// @route   PUT /api/admin/members/:id/role
// @access  Private/President
export const changeMemberRole = async (req, res) => {
  try {
    const { role } = req.body

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      })
    }

    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      })
    }

    const member = await User.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      })
    }

    const oldRole = member.role
    member.role = role
    member.isAdmin = ADMIN_ROLES.includes(role)
    member.isAlumni = role === "alumni"
    await member.save()

    // Audit log
    await createAuditLog({
      action: "member_role_change",
      user: req.user,
      targetType: "user",
      targetId: member._id,
      description: `Role changed from ${oldRole} to ${role}`,
      changes: { oldRole, newRole: role },
      req,
    })

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: member,
    })
  } catch (error) {
    logger.error(`Change role error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to change member role",
    })
  }
}

// @desc    Mark member as alumni
// @route   PUT /api/admin/members/:id/alumni
// @access  Private/Admin
export const markAsAlumni = async (req, res) => {
  try {
    const member = await User.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      })
    }

    member.isAlumni = true
    member.role = "alumni"
    member.isAdmin = false
    await member.save()

    // Audit log
    await createAuditLog({
      action: "member_update",
      user: req.user,
      targetType: "user",
      targetId: member._id,
      description: `Member marked as alumni: ${member.fullName}`,
      req,
    })

    res.status(200).json({
      success: true,
      message: "Member marked as alumni",
      data: member,
    })
  } catch (error) {
    logger.error(`Mark alumni error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to mark member as alumni",
    })
  }
}

// @desc    Delete member
// @route   DELETE /api/admin/members/:id
// @access  Private/President
export const deleteMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      })
    }

    // Check if member has expenses
    const expenseCount = await Expense.countDocuments({ member: member._id })
    if (expenseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete member with ${expenseCount} associated expenses. Consider marking as inactive instead.`,
      })
    }

    // Remove member from any boards
    await Board.updateMany(
      { "members.user": member._id },
      { $pull: { members: { user: member._id } } }
    )

    await member.deleteOne()

    if (member.photo) {
      deleteFile(member.photo)
    }

    // Audit log
    await createAuditLog({
      action: "member_delete",
      user: req.user,
      targetType: "user",
      targetId: member._id,
      description: `Member deleted: ${member.fullName}`,
      req,
    })

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    })
  } catch (error) {
    logger.error(`Delete member error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to delete member",
    })
  }
}

// @desc    Get members dropdown list
// @route   GET /api/admin/members/dropdown
// @access  Private/Admin
export const getMembersDropdown = async (req, res) => {
  try {
    const members = await User.find({ isActive: true }).select("_id firstName lastName memberId").sort({ firstName: 1 })

    res.status(200).json({
      success: true,
      data: members,
    })
  } catch (error) {
    logger.error(`Get members dropdown error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get members",
    })
  }
}

export default {
  getDashboard,
  getMembers,
  getMemberById,
  addMember,
  updateMember,
  changeMemberRole,
  markAsAlumni,
  deleteMember,
  getMembersDropdown,
}
