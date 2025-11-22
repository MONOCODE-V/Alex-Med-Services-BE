const { getPrisma } = require('../db/prisma');

async function createUser({ email, passwordHash, phone, role }) {
  const prisma = getPrisma();
  return prisma.user.create({ data: { email, passwordHash, phone, role } });
}

async function getUserById(id) {
  const prisma = getPrisma();
  return prisma.user.findUnique({ where: { id } });
}

async function createPatientProfile(userId, { firstName, lastName, dateOfBirth, gender, address, phone }) {
  const prisma = getPrisma();
  return prisma.patient.create({
    data: { userId, firstName, lastName, dateOfBirth, gender, address, phone }
  });
}

async function createDoctorProfile(userId, { firstName, lastName, yearsOfExperience, qualifications, bio, profileImage }) {
  const prisma = getPrisma();
  return prisma.doctor.create({
    data: { userId, firstName, lastName, yearsOfExperience, qualifications, bio, profileImage }
  });
}

async function createAdminProfile(userId, { firstName, lastName, adminLevel }) {
  const prisma = getPrisma();
  return prisma.admin.create({ data: { userId, firstName, lastName, adminLevel } });
}

async function listDoctors() {
  const prisma = getPrisma();
  return prisma.doctor.findMany({
    include: {
      specializations: { include: { specialization: true } },
      clinics: { include: { clinic: true } },
      reviews: true
    }
  });
}

module.exports = {
  createUser,
  getUserById,
  createPatientProfile,
  createDoctorProfile,
  createAdminProfile,
  listDoctors
};
