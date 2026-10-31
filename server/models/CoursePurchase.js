const mongoose = require("mongoose");

const coursePurchaseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

coursePurchaseSchema.index({
  studentId: 1,
  courseId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "CoursePurchase",
  coursePurchaseSchema
);