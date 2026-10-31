# AI StudyHub — MongoDB Atlas Setup

AI StudyHub now uses MongoDB Atlas for authentication **and application data**. The React UI talks to the Express API, and Mongoose persists the StudyHub data in Atlas.

## 1. Atlas setup

1. Create/use a MongoDB Atlas cluster.
2. Create a database user.
3. Add your current IP under **Security → Network Access**.
4. Open **Cluster0 → Connect → Drivers**.
5. Copy the Node.js connection string.

Use a database name such as `ai-studyhub` in the URI:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/ai-studyhub?retryWrites=true&w=majority
```

## 2. Configure the server

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ai-studyhub?retryWrites=true&w=majority
JWT_SECRET=replace_this_with_a_long_random_secret
```

Do **not** commit `server/.env` or share the connection string.

## 3. Start the API

From `server`:

```powershell
npm.cmd install
npm.cmd run dev
```

Expected:

```text
MongoDB connected: ...
Server running on http://localhost:5000
```

The first startup creates the demo users and initial StudyHub data if they do not already exist.

## 4. Start the React client

From `client`:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## 5. Demo accounts

- `student@studyhub.com` / `student123`
- `teacher@studyhub.com` / `teacher123`
- `admin@studyhub.com` / `admin123`

## MongoDB-backed modules

- User registration/login, bcrypt passwords and JWT sessions
- Courses
- Enrollments and course progress
- Materials metadata
- Quizzes
- Quiz attempt history
- Flashcards
- Study planner
- AI Tutor chat history
- Student settings
- Admin platform settings
- Admin user management

Uploaded files are currently represented by metadata in MongoDB. Actual file storage should be added later with object storage such as Cloudinary or S3 rather than storing large binary files directly in MongoDB.

## API structure

```text
React
  ↓
Express REST API
  ↓
Mongoose
  ↓
MongoDB Atlas
```

`localStorage` is only used for the JWT/session and small transient UI state; StudyHub application data is persisted through the API.
