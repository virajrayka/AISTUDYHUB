const mongoose = require("mongoose");

const studyDataSchema = new mongoose.Schema(
  {
    resource: {
      type: String,
      required: true,
      index: true,
      enum: ["catalog", "enrollments", "library", "quizzes", "system", "tasks", "chat", "quizHistory", "flashcards", "planner", "settings"],
    },
    ownerEmail: {
      type: String,
      default: null,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

studyDataSchema.index({ resource: 1, ownerEmail: 1 }, { unique: true });

module.exports = mongoose.model("StudyData", studyDataSchema);
