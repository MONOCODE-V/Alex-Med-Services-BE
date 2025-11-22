const express = require('express');
const router = express.Router();
const { createUser, createDoctorProfile, listDoctors } = require('../services/userService');
const { createSpecialization, linkDoctorSpecialization } = require('../services/specializationService');
const { createClinic, assignDoctorToClinic } = require('../services/clinicService');
const { bookAppointment, listDoctorAppointments } = require('../services/appointmentService');
const { addReview, listDoctorReviews } = require('../services/reviewService');

// Create a doctor with user account
router.post('/doctors', async (req, res) => {
  try {
    const { email, passwordHash, firstName, lastName } = req.body;
    const user = await createUser({ email, passwordHash, role: 'DOCTOR' });
    const doctor = await createDoctorProfile(user.id, { firstName, lastName });
    res.json({ user, doctor });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Add specialization
router.post('/specializations', async (req, res) => {
  try {
    const spec = await createSpecialization(req.body);
    res.json(spec);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Link doctor to specialization
router.post('/doctors/:id/specializations/:specId', async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    const specializationId = Number(req.params.specId);
    const link = await linkDoctorSpecialization(doctorId, specializationId, req.body.isPrimary);
    res.json(link);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Create clinic and assign doctor
router.post('/clinics', async (req, res) => {
  try { const clinic = await createClinic(req.body); res.json(clinic); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/clinics/:clinicId/doctors/:doctorId', async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    const clinicId = Number(req.params.clinicId);
    const link = await assignDoctorToClinic(doctorId, clinicId, req.body.consultationFee);
    res.json(link);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Book appointment
router.post('/appointments', async (req, res) => {
  try { const appt = await bookAppointment(req.body); res.json(appt); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// List doctor appointments
router.get('/doctors/:id/appointments', async (req, res) => {
  try { const items = await listDoctorAppointments(Number(req.params.id)); res.json(items); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Add review
router.post('/reviews', async (req, res) => {
  try { const rev = await addReview(req.body); res.json(rev); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// List doctor reviews
router.get('/doctors/:id/reviews', async (req, res) => {
  try { const data = await listDoctorReviews(Number(req.params.id)); res.json(data); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// List doctors
router.get('/doctors', async (_req, res) => {
  try { const doctors = await listDoctors(); res.json(doctors); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
