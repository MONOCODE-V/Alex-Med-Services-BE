import { getPrisma } from '../db/prisma';

async function createClinic({ name, city, area, address, phone, mapUrl }) {
  const prisma = getPrisma();
  return prisma.clinic.create({ data: { name, city, area, address, phone, mapUrl } });
}

async function assignDoctorToClinic(doctorId, clinicId, consultationFee) {
  const prisma = getPrisma();
  return prisma.doctorClinic.create({ data: { doctorId, clinicId, consultationFee } });
}

async function createDoctorSchedule({ doctorId, doctorClinicId, dayOfWeek, startTime, endTime }) {
  const prisma = getPrisma();
  return prisma.doctorSchedule.create({
    data: { doctorId, doctorClinicId, dayOfWeek, startTime, endTime }
  });
}

async function listClinicDoctors(clinicId) {
  const prisma = getPrisma();
  return prisma.doctorClinic.findMany({
    where: { clinicId },
    include: {
      doctor: { include: { specializations: { include: { specialization: true } } } },
      clinic: true,
      schedules: true
    }
  });
}

async function listDoctorSchedules(doctorId) {
  const prisma = getPrisma();
  return prisma.doctorSchedule.findMany({ where: { doctorId } });
}

export default {
  createClinic,
  assignDoctorToClinic,
  createDoctorSchedule,
  listClinicDoctors,
  listDoctorSchedules
};

