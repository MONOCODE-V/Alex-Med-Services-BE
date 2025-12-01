import { getPrisma } from './src/db/prisma.js';
import { hashPassword } from './src/Middlewares/auth.js';

const prisma = getPrisma();

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Create specializations
    const dentistry = await prisma.specialization.upsert({
      where: { name: 'أسنان' },
      update: {},
      create: {
        name: 'أسنان',
        nameEn: 'Dentistry',
        description: 'Dental care and oral health',
        icon: '🦷'
      }
    });

    const cardiology = await prisma.specialization.upsert({
      where: { name: 'قلب' },
      update: {},
      create: {
        name: 'قلب',
        nameEn: 'Cardiology',
        description: 'Heart and cardiovascular system',
        icon: '❤️'
      }
    });

    const orthopedics = await prisma.specialization.upsert({
      where: { name: 'عظام' },
      update: {},
      create: {
        name: 'عظام',
        nameEn: 'Orthopedics',
        description: 'Bones and joints',
        icon: '🦴'
      }
    });

    console.log('✅ Specializations created');

    // Create clinics
    const clinic1 = await prisma.clinic.create({
      data: {
        name: 'Alex Medical Center',
        city: 'الإسكندرية',
        area: 'سموحة',
        address: '123 شارع سموحة، الإسكندرية',
        phone: '03-4567890',
        mapUrl: 'https://maps.google.com/?q=Alex+Medical+Center'
      }
    });

    const clinic2 = await prisma.clinic.create({
      data: {
        name: 'Alexandria Dental Clinic',
        city: 'الإسكندرية',
        area: 'محرم بك',
        address: '456 شارع محرم بك، الإسكندرية',
        phone: '03-4567891',
        mapUrl: 'https://maps.google.com/?q=Alexandria+Dental+Clinic'
      }
    });

    console.log('✅ Clinics created');

    // Create doctor user
    const doctorPassword = await hashPassword('doctor123');
    const doctorUser = await prisma.user.create({
      data: {
        username: 'dr_ahmed',
        email: 'ahmed@doctor.com',
        passwordHash: doctorPassword,
        phone: '01234567890',
        role: 'DOCTOR',
        isActive: true
      }
    });

    // Create doctor profile
    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        firstName: 'Ahmed',
        lastName: 'Hassan',
        yearsOfExperience: 10,
        qualifications: 'MBBS, MD',
        bio: 'Experienced dentist specializing in cosmetic dentistry'
      }
    });

    console.log('✅ Doctor created');

    // Link doctor to specialization
    await prisma.doctorSpecialization.create({
      data: {
        doctorId: doctor.id,
        specializationId: dentistry.id,
        isPrimary: true
      }
    });

    // Link doctor to clinics
    const doctorClinic1 = await prisma.doctorClinic.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic1.id,
        consultationFee: 300
      }
    });

    const doctorClinic2 = await prisma.doctorClinic.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic2.id,
        consultationFee: 250
      }
    });

    console.log('✅ Doctor linked to clinics');

    // Create doctor schedules
    // Clinic 1: Sunday, Tuesday, Thursday (9 AM - 5 PM)
    await prisma.doctorSchedule.createMany({
      data: [
        {
          doctorId: doctor.id,
          doctorClinicId: doctorClinic1.id,
          dayOfWeek: 0, // Sunday
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        },
        {
          doctorId: doctor.id,
          doctorClinicId: doctorClinic1.id,
          dayOfWeek: 2, // Tuesday
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        },
        {
          doctorId: doctor.id,
          doctorClinicId: doctorClinic1.id,
          dayOfWeek: 4, // Thursday
          startTime: '09:00',
          endTime: '17:00',
          isActive: true
        }
      ]
    });

    // Clinic 2: Monday, Wednesday (10 AM - 4 PM)
    await prisma.doctorSchedule.createMany({
      data: [
        {
          doctorId: doctor.id,
          doctorClinicId: doctorClinic2.id,
          dayOfWeek: 1, // Monday
          startTime: '10:00',
          endTime: '16:00',
          isActive: true
        },
        {
          doctorId: doctor.id,
          doctorClinicId: doctorClinic2.id,
          dayOfWeek: 3, // Wednesday
          startTime: '10:00',
          endTime: '16:00',
          isActive: true
        }
      ]
    });

    console.log('✅ Doctor schedules created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Doctor: ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
    console.log(`   Email: ${doctorUser.email}`);
    console.log(`   Password: doctor123`);
    console.log(`   Clinics: ${clinic1.name}, ${clinic2.name}`);
    console.log(`   Specialization: ${dentistry.name}`);
    console.log('\n   Schedule:');
    console.log(`   - ${clinic1.name}: Sunday, Tuesday, Thursday (9:00-17:00)`);
    console.log(`   - ${clinic2.name}: Monday, Wednesday (10:00-16:00)`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
