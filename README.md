# Medical Appointment System API

Backend API for a medical appointment booking system built with Express.js, Prisma ORM, and SQLite.

## Features

- **User Management**: Patients, Doctors, and Admins with role-based access
- **Doctor Profiles**: Specializations, experience, qualifications, bio
- **Multi-Clinic Support**: Doctors can work at multiple clinics with different fees
- **Scheduling System**: Flexible weekly schedules per clinic
- **Appointment Booking**: Full appointment lifecycle (pending → confirmed → completed)
- **Reviews & Ratings**: Patient reviews with star ratings
- **Arabic Support**: Bilingual specialization names (Arabic/English)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: SQLite (easily switchable to PostgreSQL/MySQL)
- **Dev Tools**: Nodemon for hot reload

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
echo DATABASE_URL="file:./prisma/dev.db" > .env

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

## Database Schema

### Core Models
- **User**: Authentication & role management
- **Patient**: Patient profiles & medical history
- **Doctor**: Doctor profiles, qualifications, bio
- **Admin**: Administrative users with levels

### Medical System
- **Specialization**: Medical specialties (أسنان، نفسي، عظام)
- **Clinic**: Medical facilities with locations
- **DoctorSchedule**: Weekly availability per clinic
- **Appointment**: Bookings with status tracking
- **Review**: Patient feedback & ratings

### Enums
- `Role`: PATIENT, DOCTOR, ADMIN
- `AdminLevel`: SUPER, REGULAR
- `Gender`: MALE, FEMALE, OTHER
- `AppointmentStatus`: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW

## API Endpoints

See [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed documentation.

### Main Routes
- `POST /api/doctors` - Create doctor
- `GET /api/doctors` - List doctors
- `POST /api/specializations` - Add specialization
- `POST /api/clinics` - Create clinic
- `POST /api/appointments` - Book appointment
- `POST /api/reviews` - Add review

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.js              # Sample data
├── src/
│   ├── db/
│   │   └── prisma.js        # Prisma client
│   ├── services/            # Business logic
│   │   ├── userService.js
│   │   ├── specializationService.js
│   │   ├── clinicService.js
│   │   ├── appointmentService.js
│   │   └── reviewService.js
│   └── routes/
│       └── exampleRoutes.js # API routes
└── server.js                # Express app
```

## Service Layer

All business logic is organized in service modules:

```javascript
// User management
const { createUser, createDoctorProfile, listDoctors } = require('./src/services/userService');

// Specializations
const { createSpecialization, linkDoctorSpecialization } = require('./src/services/specializationService');

// Clinics & scheduling
const { createClinic, assignDoctorToClinic, createDoctorSchedule } = require('./src/services/clinicService');

// Appointments
const { bookAppointment, updateAppointmentStatus } = require('./src/services/appointmentService');

// Reviews
const { addReview, listDoctorReviews } = require('./src/services/reviewService');
```

## Development

```bash
# Start with auto-reload
npm run dev

# Run migrations after schema changes
npx prisma migrate dev --name your_migration_name

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema
npx prisma format
```

## Deployment

1. Change database to PostgreSQL in `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` in production environment

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start server:
   ```bash
   npm start
   ```

## Contributing

1. Create a feature branch: `git checkout -b feature-name`
2. Make changes and test
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature-name`
5. Create Pull Request

## License

ISC

## Support

For detailed usage instructions, see [USAGE_GUIDE.md](./USAGE_GUIDE.md)