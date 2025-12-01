# Alex Med Services - Complete API Endpoints

**Base URL:** `http://localhost:3000/api`

---

## 📋 **AUTHENTICATION ENDPOINTS** (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Register new user (patient/doctor/admin) |
| POST | `/auth/signin` | Public | Login and get tokens |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Token | Get current user profile |
| PATCH | `/auth/profile` | Token | Update current user profile |
| POST | `/auth/logout` | Token | Logout (invalidate refresh token) |
| POST | `/auth/change-password` | Token | Change password |

---

## 🏥 **PATIENT ENDPOINTS** (`/patient`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/patient/profile` | Patient | Get my patient profile |
| PATCH | `/patient/profile` | Patient | Update my patient profile |
| GET | `/patient/medical-history` | Patient | Get complete medical history |
| GET | `/patient/upcoming` | Patient | Get upcoming appointments |
| GET | `/patient/notifications` | Patient | Get my notifications |

---

## 📅 **APPOINTMENT ENDPOINTS** (`/appointments`)

### Patient Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/appointments/book` | Patient | Book new appointment |
| GET | `/appointments/my-appointments` | Patient | Get all my appointments |
| GET | `/appointments/:appointmentId` | Patient | Get specific appointment details |
| GET | `/appointments/available-slots/:doctorId` | Patient | Get doctor's available time slots |
| PATCH | `/appointments/:appointmentId/cancel` | Patient | Cancel appointment |

---

## 👨‍⚕️ **DOCTOR ENDPOINTS**

### Doctor Appointments (`/doctor/appointments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/appointments/today` | Doctor | Get today's appointments |
| GET | `/doctor/appointments` | Doctor | Get all my appointments (with filters) |
| GET | `/doctor/appointments/patient/:patientId/history` | Doctor | Get patient's medical history |
| PATCH | `/doctor/appointments/:appointmentId/status` | Doctor | Update appointment status |

### Doctor Schedules (`/doctor/schedules`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/schedules` | Doctor | Get all my schedules |
| GET | `/doctor/schedules/status` | Doctor | Check if schedule needs update |
| POST | `/doctor/schedules` | Doctor | Create single schedule |
| POST | `/doctor/schedules/week` | Doctor | Create weekly schedule |
| PATCH | `/doctor/schedules/:scheduleId` | Doctor | Update specific schedule |
| DELETE | `/doctor/schedules/:scheduleId` | Doctor | Delete specific schedule |

### Doctor Clinics (`/doctor/clinics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/clinics` | Doctor | Get my clinics with stats |
| POST | `/doctor/clinics` | Doctor | Add clinic to my profile |
| PATCH | `/doctor/clinics/:doctorClinicId` | Doctor | Update consultation fee |
| DELETE | `/doctor/clinics/:doctorClinicId` | Doctor | Remove clinic from profile |

### Doctor Specializations (`/doctor/specializations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/specializations` | Doctor | Get my specializations |
| POST | `/doctor/specializations` | Doctor | Add specialization |
| PATCH | `/doctor/specializations/:doctorSpecializationId` | Doctor | Update/set as primary |
| DELETE | `/doctor/specializations/:doctorSpecializationId` | Doctor | Remove specialization |

### Doctor Reports (`/doctor/reports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/reports/daily` | Doctor | Get daily report |
| GET | `/doctor/reports/weekly` | Doctor | Get weekly report |
| GET | `/doctor/reports/monthly` | Doctor | Get monthly report |
| GET | `/doctor/reports/patients` | Doctor | Get patient statistics |

### Doctor Notifications (`/doctor/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctor/notifications` | Doctor | Get all doctor notifications |

---

## 🔍 **DOCTORS (PUBLIC) ENDPOINTS** (`/doctors`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctors` | Public | Get all doctors (with filters) |
| GET | `/doctors/search` | Public | Search doctors |
| GET | `/doctors/top-rated` | Public | Get top-rated doctors |
| GET | `/doctors/:doctorId` | Public | Get doctor profile by ID |

---

## 🏢 **CLINIC ENDPOINTS** (`/clinics`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/clinics` | Public | Get all clinics (with filters) |
| GET | `/clinics/:clinicId` | Public | Get clinic by ID with doctors |
| POST | `/clinics` | Admin | Create new clinic |
| PATCH | `/clinics/:clinicId` | Admin | Update clinic |
| DELETE | `/clinics/:clinicId` | Admin | Delete clinic |

---

## 🎯 **SPECIALIZATION ENDPOINTS** (`/specializations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/specializations` | Public | Get all specializations |
| GET | `/specializations/:specializationId` | Public | Get specialization by ID |
| POST | `/specializations` | Admin | Create specialization |
| PATCH | `/specializations/:specializationId` | Admin | Update specialization |
| DELETE | `/specializations/:specializationId` | Admin | Delete specialization |

---

## ⭐ **REVIEW ENDPOINTS** (`/reviews`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reviews/doctors/:doctorId/reviews` | Public | Get doctor's reviews |
| POST | `/reviews` | Patient | Create review for appointment |
| GET | `/reviews/my-reviews` | Patient | Get my reviews |
| PATCH | `/reviews/:reviewId` | Patient | Update my review |
| DELETE | `/reviews/:reviewId` | Patient | Delete my review |

---

## 🔔 **NOTIFICATION ENDPOINTS** (`/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Token | Get all my notifications (with filters) |
| GET | `/notifications/unread-count` | Token | Get unread notification count |
| GET | `/notifications/:id` | Token | Get notification by ID |
| PATCH | `/notifications/:id/read` | Token | Mark notification as read |
| PATCH | `/notifications/read-all` | Token | Mark all as read |
| DELETE | `/notifications/:id` | Token | Delete notification |
| DELETE | `/notifications/read/all` | Token | Delete all read notifications |

---

## 👑 **ADMIN ENDPOINTS** (`/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | Get dashboard statistics |
| GET | `/admin/users` | Admin | Get all users (with filters) |
| GET | `/admin/appointments` | Admin | Get all appointments |
| PATCH | `/admin/users/:userId/status` | Admin | Update user status (activate/deactivate) |
| DELETE | `/admin/users/:userId` | Admin | Delete user |

---

## 🔧 **UTILITY ENDPOINTS**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Welcome message |
| GET | `/api/health` | Public | Health check |

---

## 📊 **Total Endpoints: 85**

### By Category:
- **Authentication:** 7 endpoints
- **Patient:** 5 endpoints
- **Appointments (Patient):** 5 endpoints
- **Doctor Appointments:** 4 endpoints
- **Doctor Schedules:** 6 endpoints
- **Doctor Clinics:** 4 endpoints
- **Doctor Specializations:** 4 endpoints
- **Doctor Reports:** 4 endpoints
- **Doctor Notifications:** 1 endpoint
- **Doctors (Public):** 4 endpoints
- **Clinics:** 5 endpoints
- **Specializations:** 5 endpoints
- **Reviews:** 5 endpoints
- **Notifications:** 7 endpoints
- **Admin:** 5 endpoints
- **Utility:** 2 endpoints

---

## 🔑 **Authentication Types**

- **Public:** No authentication required
- **Token:** Requires valid access token (any logged-in user)
- **Patient:** Requires patient role
- **Doctor:** Requires doctor role
- **Admin:** Requires admin role

---

## 📝 **Notes**

1. All endpoints use JSON for request/response bodies
2. Base URL includes `/api` prefix
3. Token should be sent in `Authorization` header as `Bearer <token>`
4. All timestamps are in ISO 8601 format
5. Pagination is supported on list endpoints with `limit` and `offset` query params
6. Filters are available on most GET endpoints

---

## 🚀 **Example Usage**

### Login
```bash
POST /api/auth/signin
{
  "email": "doctor1@test.com",
  "password": "password123"
}
```

### Get Doctor's Clinics
```bash
GET /api/doctor/clinics
Authorization: Bearer <access_token>
```

### Book Appointment
```bash
POST /api/appointments/book
Authorization: Bearer <patient_token>
{
  "doctorId": 1,
  "dateTime": "2025-11-26T10:00:00",
  "notes": "Regular checkup"
}
```

### Create Clinic (Admin)
```bash
POST /api/clinics
Authorization: Bearer <admin_token>
{
  "name": "City Medical Center",
  "city": "Alexandria",
  "area": "Smouha",
  "address": "123 Main St",
  "phone": "01234567890"
}
```
