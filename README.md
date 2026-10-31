# AI StudyHub — Phase 1 source baseline

This archive preserves the existing client/server folder structure. Nested ZIP backups and dependency/build folders are excluded. No real `.env` files or credentials are included.

## Start locally

### Backend (terminal 1)
```powershell
cd server
npm.cmd install
# Create server/.env from server/.env.example and fill in your real values locally.
npm.cmd run dev
```

### Frontend (terminal 2)
```powershell
cd client
npm.cmd install
# Optional: create client/.env with VITE_API_URL=http://localhost:5000
npm.cmd run dev
```

Use `http://localhost:5173` if Vite prints that URL; otherwise open the exact URL it prints.

## Environment variables
- `MONGO_URI`: MongoDB Atlas URI (keep private).
- `JWT_SECRET`: long random secret (keep private).
- `CLIENT_URL`: allowed frontend origin, such as `http://localhost:5173`.
- `VITE_API_URL`: frontend API base URL. In production, set it to the deployed backend URL.
- AI, Cloudinary, and Razorpay variables are placeholders for later phases; they are not proof that those integrations are implemented.

## Current phase notes
- Existing MERN UI, auth routes, role pages, and MongoDB-backed study-data layer retained.
- Frontend API URL now supports `VITE_API_URL`, with localhost as a development fallback.
- Cloudinary uploads, OTP, payments, and production AI integrations still require implementation and testing.
