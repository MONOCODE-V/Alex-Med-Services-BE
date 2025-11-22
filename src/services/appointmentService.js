const { getPrisma } = require('../db/prisma');

async function bookAppointment({ patientId, doctorId, clinicId, dateTime, notes }) {
  const prisma = getPrisma();
  return prisma.appointment.create({
    data: { patientId, doctorId, clinicId, dateTime, notes, status: 'CONFIRMED' }
  });
}

async function updateAppointmentStatus(id, status) {
  const prisma = getPrisma();
  return prisma.appointment.update({
    where: { id },
    data: { status }
  });
}

async function cancelAppointment(id, reason) {
  const prisma = getPrisma();
  return prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED', notes: reason }
  });
}

async function listDoctorAppointments(doctorId) {
  const prisma = getPrisma();
  return prisma.appointment.findMany({
    where: { doctorId },
    orderBy: { dateTime: 'asc' },
    include: { patient: true, clinic: true }
  });
}

async function listPatientAppointments(patientId) {
  const prisma = getPrisma();
  return prisma.appointment.findMany({
    where: { patientId },
    orderBy: { dateTime: 'asc' },
    include: { doctor: true, clinic: true }
  });
}

module.exports = {
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  listDoctorAppointments,
  listPatientAppointments
};
