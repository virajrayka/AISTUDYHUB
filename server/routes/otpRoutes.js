
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

const OTP_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

function hashCode(email, code) {
  if (!process.env.OTP_SECRET) {
    throw new Error("OTP_SECRET is not configured.");
  }

  return crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(`${email}:${code}`)
    .digest("hex");
}

// Match authController.js exactly.
function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    joined: user.createdAt,
  };
}

function loginResponse(user) {
  return {
    user: publicUser(user),
    token: signToken(user),
  };
}

// POST /api/auth/otp/request
router.post("/request", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (!process.env.OTP_SECRET || !process.env.JWT_SECRET) {
      console.error("OTP_SECRET or JWT_SECRET is missing.");

      return res.status(500).json({
        message: "OTP login is not configured correctly.",
      });
    }

    const generic = {
      message:
        "If this email is registered, a code has been sent.",
    };

    const user = await User.findOne({ email });

    // Avoid revealing whether an account exists.
    if (!user || user.status !== "active") {
      return res.json(generic);
    }

    const recent = await Otp.findOne({ email });

    if (
      recent &&
      Date.now() - recent.createdAt.getTime() <
        RESEND_SECONDS * 1000
    ) {
      return res.status(429).json({
        message:
          "Please wait a minute before requesting another code.",
      });
    }

    const code = String(
      crypto.randomInt(100000, 1000000)
    );

    // Replace any previous code for this email.
    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(
        Date.now() + OTP_MINUTES * 60 * 1000
      ),
    });

    try {
      if (!process.env.BREVO_API_KEY) {
        // Development-only fallback. Never use in production.
        if (process.env.NODE_ENV === "production") {
          throw new Error(
            "BREVO_API_KEY is missing in production."
          );
        }

        console.log(`[DEV] OTP for ${email}: ${code}`);
      } else {
        await sendEmail({
          to: email,
          subject: "Your AI StudyHub login code",
          html: `
            <div style="font-family:Arial,sans-serif">
              <h2>Your AI StudyHub login code</h2>
              <p>Use this code to sign in:</p>
              <p style="font-size:32px;letter-spacing:6px;font-weight:bold">
                ${code}
              </p>
              <p>This code expires in ${OTP_MINUTES} minutes.</p>
              <p>If you did not request this code, ignore this email.</p>
            </div>
          `,
        });
      }
    } catch (error) {
      console.error("OTP EMAIL ERROR:", error.message);
      await Otp.deleteMany({ email });

      return res.status(500).json({
        message:
          "Could not send the code. Check your email configuration and try again.",
      });
    }

    return res.json(generic);
  } catch (error) {
    console.error("OTP REQUEST ERROR:", error);

    return res.status(500).json({
      message: "Unable to request a login code.",
    });
  }
});

// POST /api/auth/otp/verify
router.post("/verify", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const code = String(req.body?.code || "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Enter a valid email and 6-digit code.",
      });
    }

    if (!process.env.OTP_SECRET || !process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "OTP login is not configured correctly.",
      });
    }

    const otp = await Otp.findOne({ email });

    if (!otp || otp.expiresAt.getTime() <= Date.now()) {
      if (otp) {
        await Otp.deleteMany({ email });
      }

      return res.status(400).json({
        message:
          "Code is invalid or expired. Request a new one.",
      });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteMany({ email });

      return res.status(429).json({
        message:
          "Too many incorrect attempts. Request a new code.",
      });
    }

    const expected = Buffer.from(otp.codeHash, "hex");
    const actual = Buffer.from(hashCode(email, code), "hex");

    const matches =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    if (!matches) {
      otp.attempts += 1;
      await otp.save();

      return res.status(400).json({
        message: "Incorrect code.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || user.status !== "active") {
      await Otp.deleteMany({ email });

      return res.status(403).json({
        message: "This account cannot log in.",
      });
    }

    // Consume the code before issuing the session.
    await Otp.deleteMany({ email });

    return res.json(loginResponse(user));
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);

    return res.status(500).json({
      message: "Unable to verify the login code.",
    });
  }
});
    
module.exports = router;
