const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  listUsers,
  updateUsers,
  getMe,
  updateMe,
  changePassword,
} = require("../controllers/userController");

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin", "teacher"), listUsers);

router.put("/", authorize("admin"), updateUsers);

router.get("/me", getMe);

router.patch("/me", updateMe);

router.patch("/me/password", changePassword);

module.exports = router;