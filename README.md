# 360ChildCare – Smart Daycare Management System

> **EC4307 – Web Application Development · Mini Project**  
> Hasanthi R.A.M.A. (EG/2023/5630) · Faculty of Engineering, University of Ruhuna

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application that helps a daycare centre manage children, attendance, daily care reports, incidents, billing and communication with parents — all from one place.

The system has three user roles, each with its own dashboard and permissions:

| Role | What they can do |
|------|------------------|
| **Admin** (centre director) | Everything: manage users, enroll children, manage classrooms & fees, invoices, announcements, reports |
| **Staff** (teachers/caregivers) | Check children in/out, record daily activity logs, report incidents, post announcements, message parents |
| **Parent** | View their own children's day (attendance, meals, naps, moods), acknowledge incident reports, view & pay invoices, report absences, message staff |

---

## Features

**Authentication & security**
- JWT authentication, passwords hashed with bcrypt
- Role-based access control on every API route (admin / staff / parent)
- Parents can only ever see data about their own children (enforced server-side)
- Parent self-registration; admin creates staff accounts
- Helmet security headers, input whitelisting (no mass-assignment), central error handling

**Child management**
- Child profiles: DOB & age, gender, blood group, classroom, allergies, medical notes
- Emergency contacts and **authorized pickup** list
- Link one or more parent accounts to each child
- Profile page with tabs: overview, attendance history, daily reports, incidents, billing

**Classrooms**
- Age groups, capacity, room number, monthly fee and assigned staff
- Live occupancy bars and class rosters

**Attendance (check-in / check-out)**
- Daily roster for all children with one-click check-in, check-out and mark-absent
- Records who dropped off / picked up, with a **warning if the pickup person is not authorized**
- Parents can report an absence in advance
- Attendance history and 7-day trend chart

**Daily reports (activity logs)**
- Log meals (amount eaten), naps (duration), activities, toilet/diaper, mood, medication and notes
- **Group logging** – record one activity for many children at once
- Parents see a timeline of their child's day

**Incident reports**
- Injury / illness / behaviour reports with severity levels and action taken
- Parents acknowledge each report and can leave a comment

**Billing**
- Create invoices with multiple line items and discounts
- **Generate monthly tuition invoices** for all children in one click (based on classroom fee)
- Record payments (cash / card / bank transfer), cancel invoices, overdue detection
- Parents view invoices and pay online (simulated payment), printable invoice view

**Communication**
- Announcements with categories, audience targeting (everyone / parents / staff), event dates and pinning
- Upcoming events panel
- Direct messaging between parents and staff with unread counts and read receipts

**Dashboards**
- Admin: enrolment, today's attendance, fees outstanding / collected, incidents, occupancy, 7-day attendance chart
- Staff: their classrooms, who is in the centre, allergy alerts, quick actions
- Parent: each child's live status today, latest activity updates, amounts due, reports to acknowledge

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router 6, Axios, Recharts, React Icons, React Hot Toast, plain CSS |
| Backend | Node.js, Express 4, Mongoose 8, JSON Web Tokens, bcryptjs, Helmet, Morgan, CORS |
| Database | MongoDB (local or MongoDB Atlas) |

---

## Project structure

```
360ChildCare/
├── package.json            # root scripts (run client + server together)
├── server/
│   ├── server.js           # entry point – connects DB and starts Express
│   ├── app.js              # Express app, middleware and routes
│   ├── config/db.js        # MongoDB connection
│   ├── middleware/         # auth (protect, authorize) & error handling
│   ├── models/             # Mongoose schemas
│   │   ├── User.js  Child.js  Classroom.js  Attendance.js
│   │   ├── ActivityLog.js  Incident.js  Invoice.js
│   │   └── Announcement.js  Message.js
│   ├── controllers/        # business logic for each module
│   ├── routes/             # REST endpoints
│   ├── utils/              # helpers & access-control utilities
│   └── seed/seed.js        # demo data
└── client/
    ├── index.html
    ├── vite.config.js      # dev proxy /api -> http://localhost:5000
    └── src/
        ├── main.jsx  App.jsx  index.css
        ├── api/client.js        # Axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── hooks/useFetch.js
        ├── utils/format.js
        ├── components/          # Layout, Modal, ProtectedRoute, ChildForm, UI kit
        └── pages/               # Dashboard, Children, ChildDetail, Classrooms,
                                 # Attendance, Activities, Incidents, Billing,
                                 # Announcements, Messages, Users, Profile, Login, Register
```

---

## Getting started

### Prerequisites
- **Node.js 18+** and npm
- **MongoDB** – either installed locally (Community Server) or a free **MongoDB Atlas** cluster

### 1. Clone and install dependencies
```bash
git clone https://github.com/hasa511/360ChildCare.git
cd 360ChildCare
npm run install-all
```

### 2. Configure environment variables
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/childcare360     # or your Atlas connection string
JWT_SECRET=put_a_long_random_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
TZ=Asia/Colombo            # daycare's time zone, used for "today" in attendance
```
(Optional) `cp client/.env.example client/.env` to change the currency (default `LKR`).

### 3. Load demo data
```bash
npm run seed
```
> ⚠️ The seed script **deletes all existing data** and replaces it with demo data (4 classrooms at LKR 2,000/month, 12 children, 11 users, attendance, reports, invoices, announcements and messages).

### 4. Run the app
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@childcare360.com | admin123 |
| Staff | kumudu@childcare360.com | staff123 |
| Parent | parent@childcare360.com | parent123 |

The login page has buttons that fill these in for you.

---

## REST API reference

All routes are prefixed with `/api`. Protected routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register a parent account |
| POST | `/auth/login` | Public | Log in, returns JWT |
| GET / PUT | `/auth/me` | Any | Get / update own profile |
| PUT | `/auth/change-password` | Any | Change password |
| GET | `/users?role=&search=` | Admin, Staff | List users |
| GET | `/users/contacts` | Any | People the user may message |
| POST / PUT / DELETE | `/users`, `/users/:id` | Admin | Manage users |
| GET | `/children?classroom=&status=&search=` | Any* | List children (*parents: own only) |
| GET | `/children/:id` | Any* | Child profile |
| POST / PUT / DELETE | `/children`, `/children/:id` | Admin | Manage children |
| GET | `/classrooms` | Any | Classrooms with enrolled counts |
| GET | `/classrooms/:id` | Admin, Staff | Classroom with roster |
| POST / PUT / DELETE | `/classrooms`, `/classrooms/:id` | Admin | Manage classrooms |
| GET | `/attendance/daily?date=&classroom=` | Admin, Staff | Daily roster + summary |
| GET | `/attendance?child=&from=&to=` | Any* | Attendance history |
| POST | `/attendance/check-in` | Admin, Staff | `{ childId, droppedOffBy }` |
| POST | `/attendance/check-out` | Admin, Staff | `{ childId, pickedUpBy }` |
| POST | `/attendance/absent` | Any* | `{ childId, date, reason }` |
| DELETE | `/attendance/:id` | Admin, Staff | Undo a record |
| GET | `/activities?child=&date=&type=` | Any* | Activity logs |
| POST | `/activities` | Admin, Staff | `{ child }` or `{ children: [] }` for group logs |
| PUT / DELETE | `/activities/:id` | Admin, Staff | Edit / delete a log |
| GET | `/incidents?child=&status=&severity=` | Any* | Incident reports |
| POST / PUT | `/incidents`, `/incidents/:id` | Admin, Staff | Create / update |
| PUT | `/incidents/:id/acknowledge` | Parent | Acknowledge with comment |
| DELETE | `/incidents/:id` | Admin | Delete |
| GET | `/invoices?status=&period=&child=` | Admin, Parent* | Invoices + summary |
| POST | `/invoices` | Admin | Create invoice |
| POST | `/invoices/generate` | Admin | Bulk monthly invoices `{ period, dueDate }` |
| PUT | `/invoices/:id/pay` | Admin, Parent* | Record / make payment |
| PUT | `/invoices/:id/cancel` | Admin | Cancel |
| PUT / DELETE | `/invoices/:id` | Admin | Edit (unpaid only) / delete |
| GET | `/announcements?category=&upcoming=true` | Any | Filtered by the user's audience |
| POST / PUT / DELETE | `/announcements`, `/announcements/:id` | Admin, Staff (own) | Manage announcements |
| GET | `/messages/conversations` | Any | Conversation list with unread counts |
| GET | `/messages/unread-count` | Any | Unread badge count |
| GET | `/messages/:userId` | Any | Thread (marks as read) |
| POST | `/messages` | Any | `{ recipient, body }` |
| GET | `/dashboard` | Any | Role-specific dashboard data |

---

## Database design (collections)

- **users** – name, email, password (hashed), role, phone, address, position, isActive
- **children** – personal details, classroom → `classrooms`, parents → `users[]`, allergies, medical notes, emergency contacts, authorized pickups, status
- **classrooms** – name, age group, capacity, monthly fee, room number, staff → `users[]`
- **attendances** – child, date (YYYY-MM-DD), status, check-in/out times, dropped off / picked up by, staff who recorded it *(unique per child per day)*
- **activitylogs** – child, date, time, type (meal/nap/activity/toilet/mood/medication/note), title, details, mood, meal amount, nap duration, recordedBy
- **incidents** – child, date, type, severity, location, description, action taken, reportedBy, acknowledgement by parent
- **invoices** – invoice number, child, parent, period (YYYY-MM), items[], discount, total, due date, status, payment info
- **announcements** – title, body, category, audience, event date, pinned, author
- **messages** – sender, recipient, body, readAt

---

## Production build / deployment

```bash
npm run build                 # builds client into client/dist
NODE_ENV=production npm start # Express serves the API and the built React app on PORT
```
Typical free hosting: **MongoDB Atlas** (database) + **Render** or **Railway** (Node server). If you host the frontend separately (e.g. Vercel/Netlify), set `VITE_API_URL` in `client/.env` to your API URL and `CLIENT_URL` in `server/.env` to the frontend URL.

---

## Possible future enhancements
- Real payment gateway integration (PayHere / Stripe)
- Photo uploads for children and daily reports (e.g. Cloudinary)
- Email / SMS / push notifications for check-in, incidents and invoices
- Real-time updates with Socket.IO
- Staff shift scheduling and payroll
- Exportable PDF/Excel reports
