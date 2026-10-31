const bcrypt = require("bcryptjs");

const User = require("../models/User");

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profilePicture: user.profilePicture || "",
    joined: user.createdAt,
  };
}

async function listUsers(req, res) {
  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    users: users.map(publicUser),
  });
}

async function updateUsers(req, res) {
  const incoming = Array.isArray(req.body?.users) ? req.body.users : [];

  const existing = await User.find({}).select("-password");

  for (const user of existing) {
    const patch = incoming.find(
      (u) => String(u.id) === String(user._id)
    );

    if (!patch) {
      if (String(user._id) !== String(req.user._id)) {
        await User.deleteOne({ _id: user._id });
      }
      continue;
    }

    if (String(user._id) === String(req.user._id)) continue;

    if (patch.name) {
      user.name = String(patch.name).trim().slice(0, 100);
    }

    if (["student", "teacher", "admin"].includes(patch.role)) {
      user.role = patch.role;
    }

    if (["active", "suspended"].includes(patch.status)) {
      user.status = patch.status;
    }

    await user.save();
  }

  return listUsers(req, res);
}

async function updateMe(req, res) {
  const name = String(req.body?.name || "").trim();

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  req.user.name = name.slice(0, 100);

  if (req.body?.profilePicture !== undefined) {
    const picture = String(req.body.profilePicture).trim();

    if (picture && !/^(https?:\/\/|\/uploads\/)/i.test(picture)) {
      return res.status(400).json({ message: "Invalid profile picture URL." });
    }

    req.user.profilePicture = picture.slice(0, 500);
  }

  await req.user.save();

  return res.json({ user: publicUser(req.user) });
}

async function getMe(req, res) {
  return res.json({ user: publicUser(req.user) });
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Current and new password are required.",
      });
    }

    if (newPassword.length < 6 || newPassword.length > 72) {
      return res.status(400).json({
        message: "New password must be 6 to 72 characters.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        message: "Password data is missing for this account.",
      });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Unable to change password.",
    });
  }
}

module.exports = {
  listUsers,
  updateUsers,
  getMe,
  updateMe,
  changePassword,
};