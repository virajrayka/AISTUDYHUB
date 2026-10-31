
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Cloudinary uses CLOUDINARY_URL automatically when available.
// Explicit configuration also supports separate environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, and WEBP images are allowed.")
      );
    }

    callback(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-studyhub",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

router.post("/", protect, (req, res) => {
  upload.single("image")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        message: uploadError.message || "Image upload failed.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No file received. Expected FormData field named 'image'.",
      });
    }

    try {
      if (
        !process.env.CLOUDINARY_URL &&
        !(
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        )
      ) {
        return res.status(500).json({
          message: "Cloudinary environment variables are not configured.",
        });
      }

      const result = await uploadToCloudinary(req.file.buffer);

      return res.status(201).json({
        message: "Image uploaded successfully.",
        image: {
          url: result.secure_url,
          filename: result.public_id,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error.message);

      return res.status(500).json({
        message: "Image upload failed. Please try again.",
      });
    }
  });
});

module.exports = router;
