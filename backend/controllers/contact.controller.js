import ContactMessage from "../models/ContactMessage.model.js"
import { sendEmail } from "../utils/email.js"
import { logger } from "../utils/logger.js"

// @desc    Submit contact form message
// @route   POST /api/public/contact/message
// @access  Public
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, subject and message are required",
      })
    }

    const contactMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    })

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contactMessage,
    })

    // Notify admins via socket
    const io = req.app.get("io")
    if (io) {
      io.to("admins").emit("new_contact_message", {
        id: contactMessage._id,
        name: contactMessage.name,
        subject: contactMessage.subject
      })
    }
  } catch (error) {
    logger.error(`Submit contact message error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    })
  }
}

// @desc    Get all contact messages
// @route   GET /api/admin/messages
// @access  Private/Admin
export const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate("replies.repliedBy", "firstName lastName")
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: messages,
    })
  } catch (error) {
    logger.error(`Get contact messages error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
    })
  }
}

// @desc    Reply to contact message
// @route   POST /api/admin/messages/:id/reply
// @access  Private/Admin
export const replyToContactMessage = async (req, res) => {
  try {
    const { replyMessage } = req.body

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      })
    }

    const messageDoc = await ContactMessage.findById(req.params.id)
    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      })
    }

    const subject = `Re: ${messageDoc.subject}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Reply from Rotaract Club</h2>
        <p>Hi ${messageDoc.name},</p>
        <p>${replyMessage.replace(/\n/g, "<br/>")}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #666;">This message is sent in response to your query: ${messageDoc.subject}</p>
      </div>
    `

    messageDoc.status = "replied"
    messageDoc.replies.push({
      message: replyMessage,
      repliedBy: req.user._id,
      repliedAt: new Date()
    })
    await messageDoc.save()

    // Send email in background (don't await for faster response)
    sendEmail({
      to: messageDoc.email,
      subject,
      html,
      text: replyMessage,
    }).catch(err => logger.error(`Background email error: ${err.message}`))

    res.status(200).json({
      success: true,
      message: "Reply processed and sending email in background",
      data: messageDoc,
    })

    // Notify other admins about the reply
    const io = req.app.get("io")
    if (io) {
      io.to("admins").emit("contact_message_updated", {
        id: messageDoc._id,
        status: "replied",
        repliedByDisplayName: req.user.firstName + " " + req.user.lastName
      })
    }
  } catch (error) {
    logger.error(`Reply contact message error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    })
  }
}

// @desc    Delete contact message
// @route   DELETE /api/admin/messages/:id
// @access  Private/Admin
export const deleteContactMessage = async (req, res) => {
  try {
    const messageDoc = await ContactMessage.findById(req.params.id)
    if (!messageDoc) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      })
    }

    await messageDoc.deleteOne()

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    })
  } catch (error) {
    logger.error(`Delete contact message error: ${error.message}`)
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    })
  }
}

