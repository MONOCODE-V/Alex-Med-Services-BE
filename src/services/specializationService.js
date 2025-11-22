const { getPrisma } = require('../db/prisma');

async function createSpecialization({ name, nameEn, description, icon }) {
  const prisma = getPrisma();
  return prisma.specialization.create({ data: { name, nameEn, description, icon } });
}

async function listSpecializations() {
  const prisma = getPrisma();
  return prisma.specialization.findMany({ orderBy: { name: 'asc' } });
}

async function linkDoctorSpecialization(doctorId, specializationId, isPrimary = false) {
  const prisma = getPrisma();
  return prisma.doctorSpecialization.create({
    data: { doctorId, specializationId, isPrimary }
  });
}

async function unlinkDoctorSpecialization(doctorId, specializationId) {
  const prisma = getPrisma();
  return prisma.doctorSpecialization.delete({
    where: { doctorId_specializationId: { doctorId, specializationId } }
  });
}

async function getDoctorWithSpecializations(doctorId) {
  const prisma = getPrisma();
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { specializations: { include: { specialization: true } } }
  });
  if (!doctor) return null;
  return {
    id: doctor.id,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    specializations: doctor.specializations.map(ds => ({
      id: ds.specialization.id,
      name: ds.specialization.name,
      nameEn: ds.specialization.nameEn,
      isPrimary: ds.isPrimary
    }))
  };
}

module.exports = {
  createSpecialization,
  listSpecializations,
  linkDoctorSpecialization,
  unlinkDoctorSpecialization,
  getDoctorWithSpecializations
};
