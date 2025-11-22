# Medical Appointment System - Usage Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
Create `.env` file:
```
DATABASE_URL="file:./prisma/dev.db"
```

**Note**: This project uses Prisma 7 with SQLite via libSQL adapter.

### 3. Install Adapters
```bash
npm install @prisma/adapter-libsql @libsql/client
```

### 4. Run Migrations
```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Seed Database (Optional)
```bash
npm run seed
```

### 7. Start Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

---

## Using the Services

All service modules are in `src/services/` and can be imported directly:

### User Service (`src/services/userService.js`)

```javascript
const { createUser, createDoctorProfile, listDoctors } = require('./src/services/userService');

// Create a new user account
const user = await createUser({
  email: 'doctor@example.com',
  passwordHash: 'hashed_password_here',
  role: 'DOCTOR'
});

// Create doctor profile
const doctor = await createDoctorProfile(user.id, {
  firstName: 'Ahmed',
  lastName: 'Hassan',
  yearsOfExperience: 10,
  qualifications: 'MD, FRCS',
  bio: 'Experienced surgeon'
});

// List all doctors with their specializations
const doctors = await listDoctors();
```

### Specialization Service (`src/services/specializationService.js`)

```javascript
const { createSpecialization, linkDoctorSpecialization } = require('./src/services/specializationService');

// Create specialization
const spec = await createSpecialization({
  name: 'أسنان',
  nameEn: 'Dentistry',
  description: 'Dental care'
});

// Link doctor to specialization
await linkDoctorSpecialization(doctorId, spec.id, true); // true = primary specialty
```

### Clinic Service (`src/services/clinicService.js`)

```javascript
const { createClinic, assignDoctorToClinic, createDoctorSchedule } = require('./src/services/clinicService');

// Create clinic
const clinic = await createClinic({
  name: 'مستشفى السلام',
  city: 'القاهرة',
  area: 'مصر الجديدة',
  address: '123 Main St',
  phone: '0123456789'
});

// Assign doctor to clinic
const assignment = await assignDoctorToClinic(doctorId, clinic.id, 500.00); // Fee: 500 EGP

// Create doctor schedule
const schedule = await createDoctorSchedule({
  doctorId: doctorId,
  doctorClinicId: assignment.id,
  dayOfWeek: 0, // Sunday
  startTime: '09:00',
  endTime: '17:00'
});
```

### Appointment Service (`src/services/appointmentService.js`)

```javascript
const { bookAppointment, listDoctorAppointments, updateAppointmentStatus } = require('./src/services/appointmentService');

// Book appointment
const appointment = await bookAppointment({
  patientId: patientId,
  doctorId: doctorId,
  clinicId: clinicId,
  dateTime: new Date('2025-11-25T10:00:00'),
  notes: 'First visit'
});

// List doctor's appointments
const appointments = await listDoctorAppointments(doctorId);

// Update appointment status
await updateAppointmentStatus(appointment.id, 'CONFIRMED');
```

### Review Service (`src/services/reviewService.js`)

```javascript
const { addReview, listDoctorReviews } = require('./src/services/reviewService');

// Add review
const review = await addReview({
  patientId: patientId,
  doctorId: doctorId,
  rating: 4.5,
  comment: 'Great doctor!'
});

// Get doctor reviews with average
const { reviews, averageRating } = await listDoctorReviews(doctorId);
```

---

## API Endpoints

All endpoints are mounted under `/api`:

### Doctors
- **POST** `/api/doctors` - Create doctor
  ```json
  {
    "email": "doctor@example.com",
    "passwordHash": "hashed_password",
    "firstName": "Ahmed",
    "lastName": "Hassan"
  }
  ```

- **GET** `/api/doctors` - List all doctors

- **GET** `/api/doctors/:id/appointments` - Get doctor's appointments

- **GET** `/api/doctors/:id/reviews` - Get doctor's reviews

### Specializations
- **POST** `/api/specializations` - Create specialization
  ```json
  {
    "name": "أسنان",
    "nameEn": "Dentistry",
    "description": "Dental care"
  }
  ```

- **POST** `/api/doctors/:id/specializations/:specId` - Link specialization
  ```json
  {
    "isPrimary": true
  }
  ```

### Clinics
- **POST** `/api/clinics` - Create clinic
  ```json
  {
    "name": "مستشفى السلام",
    "city": "القاهرة",
    "area": "مصر الجديدة",
    "address": "123 Main St",
    "phone": "0123456789"
  }
  ```

- **POST** `/api/clinics/:clinicId/doctors/:doctorId` - Assign doctor
  ```json
  {
    "consultationFee": 500.00
  }
  ```

### Appointments
- **POST** `/api/appointments` - Book appointment
  ```json
  {
    "patientId": 1,
    "doctorId": 1,
    "clinicId": 1,
    "dateTime": "2025-11-25T10:00:00Z",
    "notes": "First visit"
  }
  ```

### Reviews
- **POST** `/api/reviews` - Add review
  ```json
  {
    "patientId": 1,
    "doctorId": 1,
    "rating": 4.5,
    "comment": "Great doctor!"
  }
  ```

---

## Testing with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Create specialization
curl -X POST http://localhost:3000/api/specializations \
  -H "Content-Type: application/json" \
  -d '{"name":"أسنان","nameEn":"Dentistry"}'

# Create doctor
curl -X POST http://localhost:3000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","passwordHash":"hash123","firstName":"Ahmed","lastName":"Hassan"}'

# List doctors
curl http://localhost:3000/api/doctors
```

---

## Database Commands

```bash
# Create migration after schema changes
npx prisma migrate dev --name your_migration_name

# Reset database (DANGER: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Format schema
npx prisma format
```

---

## Project Structure

```
Alex-Med-Services-BE/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.js              # Sample data
│   └── migrations/          # Migration history
├── src/
│   ├── db/
│   │   └── prisma.js        # Prisma client singleton
│   ├── services/
│   │   ├── userService.js
│   │   ├── specializationService.js
│   │   ├── clinicService.js
│   │   ├── appointmentService.js
│   │   └── reviewService.js
│   └── routes/
│       └── exampleRoutes.js  # API routes
├── server.js                 # Express app
├── package.json
└── .env                      # Environment variables
```

---

## Next Steps

1. **Add Authentication**: Implement JWT tokens for secure login
2. **Add Validation**: Use express-validator or Joi for input validation
3. **Error Handling**: Create global error handler middleware
4. **Pagination**: Add pagination to list endpoints
5. **Search & Filters**: Add search by specialization, city, doctor name
6. **Conflict Checking**: Prevent double-booking appointments
7. **Password Hashing**: Use bcrypt before storing passwords
8. **Documentation**: Add Swagger/OpenAPI docs
9. **Testing**: Write unit and integration tests

---

## Common Issues

### Prisma Generate Error
If `npx prisma generate` fails:
```bash
# Clean and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

### Migration Failed
```bash
# Reset and reapply
npx prisma migrate reset
npx prisma migrate dev
```

### Port Already in Use
Change PORT in `.env` or:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Support

For issues or questions, check:
- [Prisma Docs](https://www.prisma.io/docs)
- [Express Docs](https://expressjs.com)
- Project GitHub repository
