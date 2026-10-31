import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { AITutor, Courses, Dashboard, Flashcards, Materials, Planner, Progress, Quiz, Settings } from "./pages/StudyPages";
import { TeacherCourses, TeacherDashboard, TeacherMaterials, TeacherQuizzes, TeacherStudents } from "./pages/TeacherPages";
import { AdminCourses, AdminDashboard, AdminSystem, AdminUsers } from "./pages/AdminPages";
import "./pages/StudyPages.css";
import "./pages/RolePages.css";
import About from "./pages/About";

const STUDENT = ["student"];
const TEACHER = ["teacher"];
const ADMIN = ["admin"];

// `roles` decides who may open a page. Leave it out to allow every signed-in user.
function Protected({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student pages */}
      <Route path="/dashboard" element={<Protected roles={STUDENT}><Dashboard /></Protected>} />
      <Route path="/ai-tutor" element={<Protected roles={STUDENT}><AITutor /></Protected>} />
      <Route path="/courses" element={<Protected roles={STUDENT}><Courses /></Protected>} />
      <Route path="/materials" element={<Protected roles={STUDENT}><Materials /></Protected>} />
      <Route path="/quiz" element={<Protected roles={STUDENT}><Quiz /></Protected>} />
      <Route path="/flashcards" element={<Protected roles={STUDENT}><Flashcards /></Protected>} />
      <Route path="/planner" element={<Protected roles={STUDENT}><Planner /></Protected>} />
      <Route path="/progress" element={<Protected roles={STUDENT}><Progress /></Protected>} />

      {/* Teacher pages */}
      <Route path="/teacher" element={<Protected roles={TEACHER}><TeacherDashboard /></Protected>} />
      <Route path="/teacher/courses" element={<Protected roles={TEACHER}><TeacherCourses /></Protected>} />
      <Route path="/teacher/materials" element={<Protected roles={TEACHER}><TeacherMaterials /></Protected>} />
      <Route path="/teacher/quizzes" element={<Protected roles={TEACHER}><TeacherQuizzes /></Protected>} />
      <Route path="/teacher/students" element={<Protected roles={TEACHER}><TeacherStudents /></Protected>} />

      {/* Admin pages */}
      <Route path="/admin" element={<Protected roles={ADMIN}><AdminDashboard /></Protected>} />
      <Route path="/admin/users" element={<Protected roles={ADMIN}><AdminUsers /></Protected>} />
      <Route path="/admin/courses" element={<Protected roles={ADMIN}><AdminCourses /></Protected>} />
      <Route path="/admin/system" element={<Protected roles={ADMIN}><AdminSystem /></Protected>} />

      {/* Shared by every role */}
      <Route path="/settings" element={<Protected><Settings /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
