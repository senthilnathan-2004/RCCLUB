import mongoose from "mongoose"

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "replied"],
      default: "new",
    },
    replies: [
      {
        message: { type: String, required: true, trim: true },
        repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        repliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

contactMessageSchema.index({ status: 1, createdAt: -1 })

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema)

export default ContactMessage
