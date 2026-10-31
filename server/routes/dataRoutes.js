const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getData, replaceData, getAllAttempts, resetData, clearMyData } = require("../controllers/dataController");

const router = express.Router();
router.get("/system", getData);
router.use(protect);
router.get("/quiz-attempts/all", getAllAttempts);
router.delete("/me", clearMyData);
router.post("/reset", authorize("admin"), resetData);
router.get("/:resource", getData);
router.put("/:resource", replaceData);

module.exports = router;
