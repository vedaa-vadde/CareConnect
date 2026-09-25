# 🏠 CareConnect — AI-Enabled Home Services Platform

CareConnect is a production-grade full-stack MERN application for booking and managing on-demand home services (appliance repair, plumbing, electrical, cleaning, and AC maintenance). It features role-based workflows for **5 distinct user roles**, AI-assisted problem diagnosis, smart provider matching, strict availability scheduling, full job evidence capture, dispute mediation, and configurable dynamic pricing rules.

---

## 🌟 Key Features

- **5 Dedicated Role Portals**:
  1. **Customer**: AI-assisted diagnosis, category browsing, quote comparison, 1-click booking, live 8-stage progress tracker, job evidence inspection, invoice review, and 5-star ratings.
  2. **Service Provider**: Verification onboarding, schedule availability calendar (preventing overlaps), live dispatch lifecycle (`accepted` → `on_the_way` → `in_progress` → `evidence_uploaded` → `completed_by_provider`), and revenue analytics.
  3. **Platform Admin**: Verification committee portal (approve/reject with audit logs), MongoDB-backed service category management, dynamic price rule configuration, user account controls, and dispute mediation.
  4. **Operations Manager**: Active field dispatch monitoring, delayed job emergency technician reassignment, and booking cancellation approvals.
  5. **Support Agent**: Mediation ticket resolution, customer/technician call logs, refund approvals, and complaint handling.
- **AI-Powered Diagnostics & Matching**:
  - Auto-classifies raw text complaints (e.g. *"Washing machine makes squeaking sound and doesn't drain"*) into categories, sub-services, required skills, and confidence score.
  - Multi-factor technician ranking engine: skills match, service radius, customer rating, completed jobs, and slot availability.
  - Seamless offline fallback when an external API key is not configured.
- **Availability & Anti-Conflict Engine**:
  - Enforces booking validation at the database level to prevent overlapping appointments.
- **Visual 8-Stage Progress Tracker**:
  - `Request Created` → `Provider Selected` → `Confirmed` → `On The Way` → `In Progress` → `Evidence Added` → `Completed` → `Review & Rated`.
- **Soft Natural Design System**:
  - Sage green, light ash, soft beige, and crisp white palette for an inviting, accessible user experience.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, TanStack React Query, Axios, Lucide React, Recharts, React Hot Toast |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT (JSON Web Tokens), bcryptjs, Multer |
| **AI Layer** | Modular AI service with Google Gemini API integration and rule-based diagnostic matcher |
| **Styling** | Vanilla CSS Design System with CSS Custom Properties, Responsive Grids, and Animations |

---

## 📁 Repository Structure

```text
careConnect/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── api/                # Axios API client & typed endpoint services
│   │   ├── components/         # Reusable UI (StatusBadge, StarRating, Modal, ProgressTracker, NotificationPanel)
│   │   ├── contexts/           # AuthContext (JWT persistence, role-based helpers)
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, Provider Apply
│   │   │   ├── customer/       # Dashboard, Service Request, Quotes, Bookings, Tracking, Disputes
│   │   │   ├── provider/       # Dashboard, Jobs, Availability Calendar, Earnings, Profile
│   │   │   ├── admin/          # Admin Dashboard, Verifications, Categories & Pricing, Disputes, Audit
│   │   │   ├── operations/     # Field Dispatches & Cancellations Queue
│   │   │   └── support/        # Support Tickets & Mediation Center
│   │   ├── App.jsx             # Route guards for all 5 roles
│   │   └── index.css           # Global design system & theme tokens
├── server/                     # Express REST Backend
│   ├── ai/                     # Modular AI classifier & matching engine
│   ├── config/                 # Database connection & environment configuration
│   ├── controllers/            # 15 domain controllers
│   ├── middleware/             # Auth, role authorization, rate limiters, file uploads
│   ├── models/                 # 12 Mongoose schemas
│   ├── routes/                 # Express API routes
│   ├── seeds/                  # Seed database script with realistic Indian context
│   ├── services/               # Invoicing, notifications, availability engine
│   └── utils/                  # Audit logger, standardized response helpers
├── .env.example                # Root environment sample
└── README.md                   # Complete documentation
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd server
npm install

# Setup environment variables
cp .env.example .env
# Default PORT is 5001 to prevent port conflicts

# Seed database with sample Indian test accounts, categories, and bookings
node seeds/seed.js

# Start backend server
node server.js
```
*Backend runs on `http://localhost:5001` (Health check: `http://localhost:5001/api/health`)*

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start development server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 👥 Platform Staff Accounts

The platform is initialized clean with zero sample customers or providers. Customers can register publicly at `/register` and service providers apply at `/provider-apply`.

The administrative staff accounts are pre-configured:

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Platform Admin** | `admin` | `Admin@123` | Approve providers, edit pricing rules, view audit logs |
| **Operations Manager** | `ops_manager` | `Ops@1234` | Reassign field technicians, approve cancellations |
| **Support Agent** | `support_agent` | `Support@123` | Resolve customer disputes, mediate refund tickets |

---

## 🔄 Major Verified Workflows

### 1. Customer End-to-End Service Booking Flow
1. Customer signs in and clicks **"Request New Service"**.
2. Selects a category (e.g. *Washing Machine Repair*) and enters issue description.
3. Clicks **"Ask AI Assistant ✨"** to receive instant diagnostic feedback and required skill requirements.
4. Selects preferred date and morning/afternoon/evening time slot, then submits.
5. System displays matching quotes and AI-recommended technicians with match reasons.
6. Customer reviews transparent pricing breakdown and clicks **"Confirm Booking 🎉"**.
7. Live 8-stage visual progress tracker updates in real-time as the technician advances through the job.
8. Upon job completion and evidence inspection, customer clicks **"Confirm Completion ✓"** and leaves a **5-star review**.

### 2. Service Provider Application & Approval Flow
1. Applicant fills out the Provider Application at `/provider-apply` with skills, categories, and service radius.
2. Account is created in `pending` status. Login attempts are blocked with an "Under Review" notice.
3. Administrator opens `/admin/providers`, examines the application and credentials, and clicks **"Approve & Activate"**.
4. Provider account is unlocked, allowing login and access to the Provider Workspace.

### 3. Technician Availability & Anti-Conflict Engine
1. Provider manages standard weekly shifts (e.g. Mon–Sat 09:00 AM – 06:00 PM).
2. When a booking is confirmed, the provider's availability slot is locked in the database.
3. Overlapping bookings for the same provider and time window are automatically rejected at the API level.

### 4. Dispute Resolution & Refund Flow
1. Customer clicks **"🆘 Help & Support"** on any active or completed booking.
2. Selects dispute reason (e.g. *Substandard repair*, *Overcharging*) and submits evidence.
3. Support / Admin opens `/admin/disputes`, reviews the complaint, logs mediation notes, and approves/refuses refunds.
4. The event is recorded in the immutable audit log (`/admin/audit`).

---

## 📡 Core API Overview

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Customer account registration |
| `/api/auth/login` | POST | Public | Multi-role JWT login |
| `/api/auth/provider-apply` | POST | Public | Technician onboarding application |
| `/api/categories` | GET, POST, PUT | Public / Admin | MongoDB-backed category catalog & pricing rules |
| `/api/service-requests` | POST, GET | Customer / Admin | Create & track service requests |
| `/api/service-requests/classify` | POST | Customer | AI problem classification |
| `/api/ai/match/:requestId` | GET | Customer | AI ranked technician recommendation |
| `/api/quotes` | POST, GET | Provider / Customer | Submit and compare quotes |
| `/api/bookings` | POST, GET | Customer / Provider | Booking confirmation & scheduling |
| `/api/bookings/:id/status` | PUT | Provider / Ops | State transitions (`on_the_way`, `in_progress`, etc.) |
| `/api/bookings/:id/confirm` | PUT | Customer | Completion confirmation |
| `/api/reviews` | POST, GET | Customer / Public | Star ratings & feedback |
| `/api/disputes` | POST, GET, PUT | Customer / Admin | Support dispute filing & mediation |
| `/api/operations/bookings/:id/assign` | PUT | Operations / Admin | Emergency technician reassignment |
| `/api/operations/bookings/:id/cancellation` | PUT | Operations / Admin | Process cancellation and refund requests |
| `/api/analytics` | GET | Admin / Operations | Platform metrics & revenue data |
| `/api/analytics/audit` | GET | Admin | Immutable compliance audit ledger |

---

## 🔒 Security & Best Practices

- **Strict Role-Based Access Control**: Middleware checks role authorization on all sensitive routes.
- **Resource Ownership Validation**: Customers and providers can only modify records they own.
- **Data Protection**: Passwords hashed with `bcryptjs` (salt factor 12).
- **Graceful Error Handling**: Standardized JSON envelopes across all endpoints with zero blank-screen failures.

---

## 📄 License
CareConnect is released under the **MIT License**.
