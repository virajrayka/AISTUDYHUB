
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { protect } = require("../middleware/authMiddleware");
const CoursePurchase = require("../models/CoursePurchase");

const router = express.Router();

// Server-controlled premium course prices (amounts in rupees).
const PREMIUM_COURSES = {
  "premium-web-demo": {
    title: "Full-Stack Web Development",
    amount: 99,
  },
  "premium-security-demo": {
    title: "Cybersecurity Fundamentals",
    amount: 99,
  },
};

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing in server/.env");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Require a logged-in student.
router.use(protect, (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({
      message: "Only students can purchase premium courses.",
    });
  }

  next();
});

// Create a Razorpay order for an approved premium demo course.
router.post("/create-order", async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = PREMIUM_COURSES[String(courseId)];

    if (!course) {
      return res.status(400).json({
        message: "Invalid premium course.",
      });
    }

    const existingPurchase = await CoursePurchase.findOne({
      studentId: req.user._id,
      courseId: String(courseId),
      status: "paid",
    });

    if (existingPurchase) {
      return res.status(409).json({
        message: "You have already purchased this course.",
      });
    }

    const amountInPaise = course.amount * 100;

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `sh_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
      notes: {
        studentId: String(req.user._id),
        courseId: String(courseId),
      },
    });

    await CoursePurchase.create({
      studentId: req.user._id,
      studentEmail: req.user.email,
      courseId: String(courseId),
      courseTitle: course.title,
      amount: course.amount,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.title,
    });
} catch (error) {
  console.error("Create payment order failed:", error);

  return res.status(500).json({
    message: "Unable to create payment order.",
    error: error?.message || String(error),
    statusCode: error?.statusCode || error?.status,
  });
}
});

// Verify the Checkout signature and confirm payment details.
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({
        message: "Payment verification details are incomplete.",
      });
    }

    const purchase = await CoursePurchase.findOne({
      razorpayOrderId: orderId,
      studentId: req.user._id,
    });

    if (!purchase) {
      return res.status(404).json({
        message: "Payment order not found for this student.",
      });
    }

    // Idempotent response if this order was already verified.
    if (purchase.status === "paid") {
      return res.json({
        verified: true,
        courseId: purchase.courseId,
        message: "Course purchase already confirmed.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const supplied = Buffer.from(signature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed.",
      });
    }

    const payment = await getRazorpay().payments.fetch(paymentId);

    if (
      payment.order_id !== orderId ||
      payment.amount !== purchase.amount * 100 ||
      payment.currency !== purchase.currency ||
      payment.status !== "captured"
    ) {
      return res.status(409).json({
        message: "Payment is not captured or does not match this order.",
      });
    }

    purchase.razorpayPaymentId = paymentId;
    purchase.status = "paid";
    await purchase.save();

    return res.json({
      verified: true,
      courseId: purchase.courseId,
      message: "Payment verified. Premium course unlocked.",
    });
  } catch (error) {
  console.error("Create payment order failed:", {
    message: error?.message,
    statusCode: error?.statusCode,
    error: error?.error,
    description: error?.description,
    stack: error?.stack,
  });

  res.status(500).json({
    message: "Unable to create payment order.",
    error: error?.message || "Unknown Razorpay error",
  });

  }
});

// Check the logged-in student's paid access.
router.get("/access/:courseId", async (req, res) => {
  try {
    const courseId = String(req.params.courseId);

    if (!PREMIUM_COURSES[courseId]) {
      return res.status(404).json({
        message: "Premium course not found.",
      });
    }

    const purchase = await CoursePurchase.findOne({
      studentId: req.user._id,
      courseId,
      status: "paid",
    }).select("_id courseId courseTitle");

    return res.json({
      hasAccess: Boolean(purchase),
      course: purchase
        ? {
            id: purchase.courseId,
            title: purchase.courseTitle,
          }
        : null,
    });
  } catch (error) {
    console.error("Course access check failed:", error.message);
    return res.status(500).json({
      message: "Unable to check course access.",
    });
  }
});

module.exports = router;
