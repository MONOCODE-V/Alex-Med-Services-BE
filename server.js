import express from 'express';
import cors from 'cors';
import { ErrorHandler } from './src/utils/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import appointmentRoutes from './src/routes/user/appointment.js';
import doctorScheduleRoutes from './src/routes/doctor/schedule.js';
import doctorAppointmentRoutes from './src/routes/doctor/appointment.js';
import doctorReportRoutes from './src/routes/doctor/report.js';
import doctorNotificationRoutes from './src/routes/doctor/notification.js';
import patientRoutes from './src/routes/patientRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import specializationRoutes from './src/routes/specializationRoutes.js';
import doctorSpecializationRoutes from './src/routes/doctor/specialization.js';
import clinicRoutes from './src/routes/clinicRoutes.js';
import doctorClinicRoutes from './src/routes/doctor/clinic.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import adminRoutes from './src/routes/admin/admin.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

ErrorHandler.setupGlobalHandlers();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor/schedules', doctorScheduleRoutes);
app.use('/api/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/doctor/reports', doctorReportRoutes);
app.use('/api/doctor/notifications', doctorNotificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/doctor/specializations', doctorSpecializationRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/doctor/clinics', doctorClinicRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Alex Med Services API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use(ErrorHandler.notFoundHandler());
app.use(ErrorHandler.expressErrorHandler());

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

ErrorHandler.serverErrorHandler(server, PORT);
