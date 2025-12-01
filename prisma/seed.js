import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctorSpecialization.deleteMany();
  await prisma.doctorClinic.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  // Create Specializations
  console.log('📚 Creating specializations...');
  const cardiology = await prisma.specialization.create({
    data: { name: 'Cardiology', description: 'Heart and cardiovascular system' }
  });
  const dermatology = await prisma.specialization.create({
    data: { name: 'Dermatology', description: 'Skin, hair, and nails' }
  });
  const pediatrics = await prisma.specialization.create({
    data: { name: 'Pediatrics', description: 'Medical care of infants, children, and adolescents' }
  });
  const orthopedics = await prisma.specialization.create({
    data: { name: 'Orthopedics', description: 'Musculoskeletal system' }
  });

  // Create Clinics
  console.log('🏥 Creating clinics...');
  const clinic1 = await prisma.clinic.create({
    data: {
      name: 'Alex Medical Center',
      city: 'Alexandria',
      area: 'Smouha',
      address: '123 Medical Plaza, Smouha, Alexandria',
      phone: '0123456789',
      mapUrl: 'https://maps.google.com'
    }
  });
  const clinic2 = await prisma.clinic.create({
    data: {
      name: 'City Health Clinic',
      city: 'Cairo',
      area: 'Nasr City',
      address: '456 Healthcare Ave, Nasr City, Cairo',
      phone: '0123456790',
      mapUrl: 'https://maps.google.com'
    }
  });

  // Create Patients
  console.log('👥 Creating patients...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const patient1User = await prisma.user.create({
    data: {
      email: 'patient1@test.com',
      username: 'patient1',
      passwordHash: hashedPassword,
      role: 'PATIENT',
      phone: '01234567891',
      isActive: true,
      patient: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'MALE',
          phone: '01234567891'
        }
      }
    }
  });

  const patient2User = await prisma.user.create({
    data: {
      email: 'patient2@test.com',
      username: 'patient2',
      passwordHash: hashedPassword,
      role: 'PATIENT',
      phone: '01234567893',
      isActive: true,
      patient: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date('1985-08-20'),
          gender: 'FEMALE',
          phone: '01234567893'
        }
      }
    }
  });

  // Create Doctors with Schedules
  console.log('👨‍⚕️ Creating doctors...');
  
  // Doctor 1 - Cardiologist
  const doctor1User = await prisma.user.create({
    data: {
      email: 'doctor1@test.com',
      username: 'doctor1',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      phone: '01234567895',
      isActive: true,
      doctor: {
        create: {
          firstName: 'Ahmed',
          lastName: 'Hassan',
          yearsOfExperience: 15,
          bio: 'Experienced cardiologist specializing in heart disease prevention and treatment'
        }
      }
    },
    include: { doctor: true }
  });
  const doctor1 = doctor1User.doctor;
  
  // Add doctor to both clinics
  const doctor1Clinic1 = await prisma.doctorClinic.create({
    data: {
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      consultationFee: 200.00
    }
  });

  const doctor1Clinic2 = await prisma.doctorClinic.create({
    data: {
      doctorId: doctor1.id,
      clinicId: clinic2.id,
      consultationFee: 250.00
    }
  });

  // Add specialization
  await prisma.doctorSpecialization.create({
    data: {
      doctorId: doctor1.id,
      specializationId: cardiology.id
    }
  });

  // Add schedules for Clinic 1 (Monday, Wednesday, Friday: 9 AM - 5 PM)
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: doctor1.id,
        doctorClinicId: doctor1Clinic1.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      },
      {
        doctorId: doctor1.id,
        doctorClinicId: doctor1Clinic1.id,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      },
      {
        doctorId: doctor1.id,
        doctorClinicId: doctor1Clinic1.id,
        dayOfWeek: 5, // Friday
        startTime: '09:00',
        endTime: '17:00',
        isActive: true
      }
    ]
  });

  // Add schedules for Clinic 2 (Tuesday, Thursday: 10 AM - 6 PM)
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: doctor1.id,
        doctorClinicId: doctor1Clinic2.id,
        dayOfWeek: 2, // Tuesday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      },
      {
        doctorId: doctor1.id,
        doctorClinicId: doctor1Clinic2.id,
        dayOfWeek: 4, // Thursday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      }
    ]
  });

  // Doctor 2 - Dermatologist
  const doctor2User = await prisma.user.create({
    data: {
      email: 'doctor2@test.com',
      username: 'doctor2',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      phone: '01234567896',
      isActive: true,
      doctor: {
        create: {
          firstName: 'Sara',
          lastName: 'Mohamed',
          yearsOfExperience: 10,
          bio: 'Specialist in treating skin conditions and cosmetic dermatology'
        }
      }
    },
    include: { doctor: true }
  });
  const doctor2 = doctor2User.doctor;

  const doctor2Clinic = await prisma.doctorClinic.create({
    data: {
      doctorId: doctor2.id,
      clinicId: clinic1.id
    }
  });

  await prisma.doctorSpecialization.create({
    data: {
      doctorId: doctor2.id,
      specializationId: dermatology.id
    }
  });

  // Add schedules (Tuesday, Thursday, Saturday: 10 AM - 6 PM)
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: doctor2.id,
        doctorClinicId: doctor2Clinic.id,
        dayOfWeek: 2, // Tuesday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      },
      {
        doctorId: doctor2.id,
        doctorClinicId: doctor2Clinic.id,
        dayOfWeek: 4, // Thursday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      },
      {
        doctorId: doctor2.id,
        doctorClinicId: doctor2Clinic.id,
        dayOfWeek: 6, // Saturday
        startTime: '10:00',
        endTime: '18:00',
        isActive: true
      }
    ]
  });

  // Doctor 3 - Pediatrician
  const doctor3User = await prisma.user.create({
    data: {
      email: 'doctor3@test.com',
      username: 'doctor3',
      passwordHash: hashedPassword,
      role: 'DOCTOR',
      phone: '01234567897',
      isActive: true,
      doctor: {
        create: {
          firstName: 'Omar',
          lastName: 'Ali',
          yearsOfExperience: 12,
          bio: 'Dedicated pediatrician with focus on child health and development'
        }
      }
    },
    include: { doctor: true }
  });
  const doctor3 = doctor3User.doctor;

  const doctor3Clinic = await prisma.doctorClinic.create({
    data: {
      doctorId: doctor3.id,
      clinicId: clinic2.id
    }
  });

  await prisma.doctorSpecialization.create({
    data: {
      doctorId: doctor3.id,
      specializationId: pediatrics.id
    }
  });

  // Add schedules (Monday to Friday: 8 AM - 4 PM)
  await prisma.doctorSchedule.createMany({
    data: [1, 2, 3, 4, 5].map(day => ({
      doctorId: doctor3.id,
      doctorClinicId: doctor3Clinic.id,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '16:00',
      isActive: true
    }))
  });

  // Create Admin
  console.log('👨‍💼 Creating admin...');
  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phone: '01234567898',
      isActive: true,
      admin: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          adminLevel: 'SUPER_ADMIN'
        }
      }
    }
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Test Accounts Created:');
  console.log('\n👥 Patients:');
  console.log('   Email: patient1@test.com | Password: password123');
  console.log('   Email: patient2@test.com | Password: password123');
  console.log('\n👨‍⚕️ Doctors:');
  console.log('   Email: doctor1@test.com | Password: password123 (Cardiologist - Mon/Wed/Fri 9-5)');
  console.log('   Email: doctor2@test.com | Password: password123 (Dermatologist - Tue/Thu/Sat 10-6)');
  console.log('   Email: doctor3@test.com | Password: password123 (Pediatrician - Mon-Fri 8-4)');
  console.log('\n👨‍💼 Admin:');
  console.log('   Email: admin@test.com | Password: password123');
  console.log('\n🏥 Clinics:');
  console.log('   - Alex Medical Center (Alexandria)');
  console.log('   - City Health Clinic (Cairo)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
