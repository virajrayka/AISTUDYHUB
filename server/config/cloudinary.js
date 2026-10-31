const cloudinary = require("cloudinary").v2;

// CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// The URL is read from server/.env by dotenv in server.js.
const cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (parsed.protocol !== "cloudinary:") {
      throw new Error("CLOUDINARY_URL must start with cloudinary://");
    }

    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username),
      api_secret: decodeURIComponent(parsed.password),
      secure: true,
    });
  } catch (error) {
    console.error("CLOUDINARY_URL format is invalid. Check server/.env.");
  }
}

module.exports = cloudinary;
