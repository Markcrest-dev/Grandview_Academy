# Grandview Academy SMS — Backend API

This is the Node.js + Express backend service for the Grandview Academy School Management System. It connects to a Supabase PostgreSQL database and integrates with Cloudinary for file/document storage.

## Features

- **Express.js Server**: Configured with security headers (`helmet`), `cors` limits, request logging (`morgan`), and a robust error-handling middleware structure.
- **Supabase Integration**: Dual client setup using both user-specific anon credentials (which respect Row Level Security) and system-level admin credentials (which bypass RLS for server-side management).
- **PostgreSQL Database Schema**: Comprehensive relational database model (`migrations/001_initial_schema.sql`) covering:
  - Users & Role Management (`users`, `students`, `staff`, `parents`, `parent_student`)
  - Academics Structure (`academic_years`, `terms`, `classes`, `subjects`, `class_subjects`)
  - Operations & Data Collection (`attendance`, `grades`, `fee_structures`, `fee_payments`, `timetable_slots`)
  - Utilities & Logs (`announcements`, `documents`, `audit_logs`)
- **Cloudinary Integration**: Multer memory storage adapter setup to stream uploaded photos, profile avatars, and learning documents straight to Cloudinary without local disk usage.
- **RESTful Router Scaffold**: Modular routing endpoints covering CRUD operations, validation checks, and health endpoints.

---

## Setup & Run

### 1. Prerequisite Accounts

- **Supabase**: Register a free project at [supabase.com](https://supabase.com).
- **Cloudinary**: Create a free image storage account at [cloudinary.com](https://cloudinary.com).

### 2. Environment Configuration

1. In the `backend` folder, duplicate `.env.example` as `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase project settings and Cloudinary keys:
   - **Supabase URL & API Keys**: Get these in the Supabase Dashboard under `Project Settings` ➔ `API`.
   - **Cloudinary API Keys**: Get these in your Cloudinary Dashboard under API Keys.

### 3. Database Migration

Copy the contents of `migrations/001_initial_schema.sql` and run it inside your Supabase project:
1. Go to your **Supabase Dashboard** for the project.
2. Click **SQL Editor** on the left menu.
3. Click **New Query**.
4. Paste the SQL contents from [migrations/001_initial_schema.sql](migrations/001_initial_schema.sql) and click **Run**.

This builds all 18 tables, indexes, check constraints, enum categories, and automated `updated_at` triggers in your PostgreSQL instance.

### 4. Running the Development Server

Start the development server with hot-reloading (runs on Port `5000` by default):

```bash
cd backend
npm run dev
```

The server will validate environment variables at startup, test its connection to Supabase, and listen for incoming HTTP request traffic.

---

## Folder Structure

```
backend/
├── migrations/
│   └── 001_initial_schema.sql  # Full SQL schema migrations
├── src/
│   ├── config/
│   │   ├── database.js        # Supabase PostgreSQL client setup
│   │   ├── cloudinary.js      # Cloudinary storage SDK configuration
│   │   └── env.js             # Environment variable validator
│   ├── middleware/
│   │   ├── errorHandler.js    # Global centralized Express error handler
│   │   ├── requestLogger.js   # Morgan logging configurations
│   │   └── cors.js            # Cross-origin resource sharing policy
│   ├── routes/
│   │   ├── index.js           # Main routing mounting gateway
│   │   ├── health.js          # API health checks
│   │   ├── users.js           # User scaffolding
│   │   ├── students.js        # Student profiles
│   │   ├── staff.js           # Staff (teachers & administrators)
│   │   ├── classes.js         # Classroom registration
│   │   ├── subjects.js        # Academic subjects
│   │   ├── attendance.js      # Attendance records
│   │   ├── grades.js          # Gradebooks & exams
│   │   ├── fees.js            # Fee structures & payments
│   │   ├── announcements.js   # Notices & broadcasts
│   │   ├── timetable.js       # Daily timetables
│   │   └── uploads.js         # Cloudinary file/photo gateway
│   ├── utils/
│   │   ├── apiResponse.js     # Uniform API response standardizer
│   │   └── validators.js      # Basic input/format validators
│   └── server.js              # Server entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## API Documentation Quick Reference

| Route | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Verifies server and database connection status |
| `/api/users` | `GET` / `POST` | User list (paginated, with filter) and registration |
| `/api/users/:id` | `GET` / `PUT` / `DELETE` | Specific user management |
| `/api/students` | `GET` / `POST` | Student registration and listing |
| `/api/students/:id` | `GET` / `PUT` | View/modify student profile details |
| `/api/staff` | `GET` / `POST` | Staff directory creation and searching |
| `/api/staff/:id` | `GET` / `PUT` | View/modify staff details |
| `/api/classes` | `GET` / `POST` | Register class cohorts (e.g. JSS 1A) |
| `/api/classes/:id/students`| `GET` | View list of students inside a specific class |
| `/api/subjects` | `GET` / `POST` | Core curriculum subject management |
| `/api/attendance` | `GET` / `POST` | Query daily attendance logs / record new logs |
| `/api/attendance/student/:id`| `GET` | Fetch entire attendance dashboard for student |
| `/api/grades` | `GET` / `POST` | Class grades review / enter new scores |
| `/api/grades/student/:id`| `GET` | Fetch student transcript card |
| `/api/fees/structures` | `GET` / `POST` | Set tuition rates per term and grade |
| `/api/fees/payments` | `GET` / `POST` | View payment records / register a new receipt |
| `/api/fees/payments/student/:id`| `GET` | Fetch student financial statement |
| `/api/announcements` | `GET` / `POST` / `DELETE` | Broadcasting alerts to specific groups |
| `/api/timetable/class/:id`| `GET` | Fetch class timetable slots |
| `/api/timetable` | `POST` / `DELETE` | Modify or add timetable entries |
| `/api/uploads` | `POST` | Multi-part form-data file upload (images, docs) to Cloudinary |
