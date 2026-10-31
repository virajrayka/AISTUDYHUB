
const StudyData = require("../models/StudyData");

const GLOBAL = new Set([
  "catalog",
  "enrollments",
  "library",
  "quizzes",
  "system",
]);

const USER = new Set([
  "tasks",
  "chat",
  "quizHistory",
  "flashcards",
  "planner",
  "settings",
]);

const ALL = new Set([...GLOBAL, ...USER]);

function ownerFor(req, resource) {
  return USER.has(resource) ? req.user.email : null;
}

function canWrite(req, resource) {
  if (resource === "system") {
    return req.user.role === "admin";
  }

  if (resource === "catalog" || resource === "quizzes") {
    return ["teacher", "admin"].includes(req.user.role);
  }

  if (resource === "enrollments" || resource === "library") {
    return ["teacher", "admin"].includes(req.user.role);
  }

  return USER.has(resource);
}

async function getData(req, res) {
  const { resource } = req.params;

  if (!ALL.has(resource)) {
    return res.status(404).json({
      message: "Unknown data resource.",
    });
  }

  const ownerEmail = ownerFor(req, resource);

  let doc = await StudyData.findOne({ resource, ownerEmail });

  if (!doc) {
    const fallback =
      resource === "system"
        ? { allowRegistration: true, requireApproval: true }
        : [];

    doc = await StudyData.create({
      resource,
      ownerEmail,
      data: fallback,
    });
  }

  // The catalog is shared. The frontend and admin need the same
  // catalog so course creation and approval stay synchronized.
  return res.json({ data: doc.data });
}

async function replaceData(req, res) {
  const { resource } = req.params;

  if (!ALL.has(resource)) {
    return res.status(404).json({
      message: "Unknown data resource.",
    });
  }

  if (!canWrite(req, resource)) {
    return res.status(403).json({
      message: "You do not have permission to modify this resource.",
    });
  }

  const ownerEmail = ownerFor(req, resource);
  const incoming = req.body?.data;

  if (typeof incoming === "undefined") {
    return res.status(400).json({
      message: "data is required.",
    });
  }

  if (resource === "catalog") {
    if (!Array.isArray(incoming)) {
      return res.status(400).json({
        message: "Course catalog must be an array.",
      });
    }

    const catalogDoc = await StudyData.findOne({
      resource: "catalog",
      ownerEmail: null,
    });

    const existing = Array.isArray(catalogDoc?.data)
      ? catalogDoc.data
      : [];

    // Admins may approve, reject, update, or delete catalog entries.
    if (req.user.role === "admin") {
      const ids = new Set();

      for (const course of incoming) {
        if (!course || course.id == null) {
          return res.status(400).json({
            message: "Every course must have an ID.",
          });
        }

        const id = String(course.id);

        if (ids.has(id)) {
          return res.status(400).json({
            message: "Duplicate course IDs are not allowed.",
          });
        }

        ids.add(id);
      }

      const saved = await StudyData.findOneAndUpdate(
        { resource: "catalog", ownerEmail: null },
        { $set: { data: incoming } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({
        data: saved.data,
        message: "Course catalog updated.",
      });
    }

    // Teacher updates are merged into the shared catalog.
    // Courses owned by other teachers are never overwritten or deleted.
    if (req.user.role === "teacher") {
      const incomingIds = new Set();

      for (const course of incoming) {
        if (!course || course.id == null) {
          return res.status(400).json({
            message: "Every course must have an ID.",
          });
        }

        const id = String(course.id);

        if (incomingIds.has(id)) {
          return res.status(400).json({
            message: "Duplicate course IDs are not allowed.",
          });
        }

        incomingIds.add(id);
      }

      const systemDoc = await StudyData.findOne({
        resource: "system",
        ownerEmail: null,
      });

      const requireApproval =
        systemDoc?.data?.requireApproval !== false;

      const existingById = new Map(
        existing.map((course) => [String(course.id), course])
      );

      const preservedOtherCourses = existing.filter(
        (course) => course.teacherEmail !== req.user.email
      );

      const teacherCourses = [];

      for (const course of incoming) {
        const id = String(course.id);
        const oldCourse = existingById.get(id);

        // Ignore another teacher's course from the submitted catalog.
        // Its original server-side version is preserved below.
        if (oldCourse && oldCourse.teacherEmail !== req.user.email) {
          continue;
        }

        // A new course belongs to the signed-in teacher.
        if (!oldCourse) {
          teacherCourses.push({
            ...course,
            teacherEmail: req.user.email,
            teacherName: req.user.name,
            status: requireApproval ? "pending" : "approved",
          });

          continue;
        }

        // Keep course ownership and approval status under server control.
        teacherCourses.push({
          ...course,
          teacherEmail: req.user.email,
          teacherName: oldCourse.teacherName || req.user.name,
          status: oldCourse.status || (
            requireApproval ? "pending" : "approved"
          ),
        });
      }

      // Omitted courses owned by this teacher are deleted.
      // Courses belonging to other teachers remain untouched.
      const merged = [
        ...preservedOtherCourses,
        ...teacherCourses,
      ];

      const saved = await StudyData.findOneAndUpdate(
        { resource: "catalog", ownerEmail: null },
        { $set: { data: merged } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json({
        data: saved.data,
        message: "Your courses were saved.",
      });
    }
  }

  // Keep the existing behavior for other resources.
  const saved = await StudyData.findOneAndUpdate(
    { resource, ownerEmail },
    { $set: { data: incoming } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({ data: saved.data });
}

async function getAllAttempts(req, res) {
  if (!["teacher", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "You do not have permission to view all quiz attempts.",
    });
  }

  const docs = await StudyData.find({
    resource: "quizHistory",
  }).lean();

  const attempts = docs.flatMap((doc) =>
    Array.isArray(doc.data)
      ? doc.data.map((attempt) => ({
          ...attempt,
          email: doc.ownerEmail,
        }))
      : []
  );

  return res.json({ data: attempts });
}

async function resetData(req, res) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  await StudyData.deleteMany({});

  return res.json({ message: "Study data reset." });
}

async function clearMyData(req, res) {
  await StudyData.deleteMany({
    ownerEmail: req.user.email,
  });

  return res.json({
    message: "Your study data was cleared.",
  });
}

module.exports = {
  getData,
  replaceData,
  getAllAttempts,
  resetData,
  clearMyData,
};
