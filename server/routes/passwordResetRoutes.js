
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const PasswordResetOtp = require("../models/PasswordResetOtp");
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

// POST /api/auth/password-reset/request
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
      return res.status(500).json({
        message: "Password reset is not configured correctly.",
      });
    }

    const genericMessage = {
      message:
        "If an active account exists for this email, a reset code has been sent.",
    };

    const user = await User.findOne({ email, status: "active" });

    // Never disclose whether an account exists.
    if (!user) {
      return res.json(genericMessage);
    }

    const recent = await PasswordResetOtp.findOne({ email });

    if (
      recent &&
      Date.now() - recent.createdAt.getTime() <
        RESEND_SECONDS * 1000
    ) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting another code.",
      });
    }

    const code = String(crypto.randomInt(100000, 1000000));

    await PasswordResetOtp.deleteMany({ email });

    await PasswordResetOtp.create({
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
    });

    try {
      if (!process.env.BREVO_API_KEY) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("BREVO_API_KEY is missing in production.");
        }

        // Development only; never expose codes in an API response.
        console.log(`[DEV] Password reset OTP for ${email}: ${code}`);
      } else {
        await sendEmail({
          to: email,
          subject: "Reset your AI StudyHub password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
              <h2>Reset your AI StudyHub password</h2>
              <p>Use this verification code to reset your password:</p>
              <p style="font-size:32px;letter-spacing:6px;font-weight:bold">
                ${code}
              </p>
              <p>This code expires in ${OTP_MINUTES} minutes.</p>
              <p>If you did not request a password reset, ignore this email.</p>
            </div>
          `,
        });
      }
    } catch (error) {
      console.error("PASSWORD RESET EMAIL ERROR:", error.message);
      await PasswordResetOtp.deleteMany({ email });

      return res.status(500).json({
        message: "Could not send the reset code. Please try again later.",
      });
    }

    return res.json(genericMessage);
  } catch (error) {
    console.error("PASSWORD RESET REQUEST ERROR:", error);

    return res.status(500).json({
      message: "Unable to request a password reset.",
    });
  }
});

// POST /api/auth/password-reset/confirm
router.post("/confirm", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body?.code || "").trim();
    const password = req.body?.password;

    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Enter a valid email and 6-digit reset code.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        message: "Password must be 128 characters or fewer.",
      });
    }

    if (!process.env.OTP_SECRET) {
      return res.status(500).json({
        message: "Password reset is not configured correctly.",
      });
    }

    const resetOtp = await PasswordResetOtp.findOne({ email });

    if (!resetOtp || resetOtp.expiresAt.getTime() <= Date.now()) {
      if (resetOtp) {
        await PasswordResetOtp.deleteMany({ email });
      }

      return res.status(400).json({
        message: "Reset code is invalid or expired. Request a new one.",
      });
    }

    if (resetOtp.attempts >= MAX_ATTEMPTS) {
      await PasswordResetOtp.deleteMany({ email });

      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new reset code.",
      });
    }

    const expected = Buffer.from(resetOtp.codeHash, "hex");
    const actual = Buffer.from(hashCode(email, code), "hex");

    const matches =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    if (!matches) {
      resetOtp.attempts += 1;
      await resetOtp.save();

      if (resetOtp.attempts >= MAX_ATTEMPTS) {
        await PasswordResetOtp.deleteMany({ email });

        return res.status(429).json({
          message: "Too many incorrect attempts. Request a new reset code.",
        });
      }

      return res.status(400).json({
        message: "Incorrect reset code.",
      });
    }

    const user = await User.findOne({ email, status: "active" });

    if (!user) {
      await PasswordResetOtp.deleteMany({ email });

      return res.status(400).json({
        message: "Unable to reset this account's password.",
      });
    }

    // Hash the password before storing it in MongoDB.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Consume the code before changing the password.
    await PasswordResetOtp.deleteMany({ email });

    user.password = hashedPassword;
    await user.save();

    return res.json({
      message: "Password reset successful. You can now sign in.",
    });
  } catch (error) {
    console.error("PASSWORD RESET CONFIRM ERROR:", error);

    return res.status(500).json({
      message: "Unable to reset your password.",
    });
  }
});

module.exports = router;
