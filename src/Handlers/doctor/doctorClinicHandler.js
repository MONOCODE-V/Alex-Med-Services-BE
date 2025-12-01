import { getPrisma } from '../../db/prisma.js';
import ResponseHelper from '../../utils/response.js';
import { 
  ValidationError, 
  NotFoundError,
  ConflictError
} from '../../utils/errorHandler.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * Doctor assigns themselves to a clinic
 */
const addMyClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { clinicId, consultationFee } = req.body;

  if (!clinicId) {
    throw new ValidationError('Clinic ID is required');
  }

  // Verify clinic exists
  const clinic = await prisma.clinic.findUnique({
    where: { id: parseInt(clinicId) }
  });

  if (!clinic) {
    throw new NotFoundError('Clinic not found');
  }

  // Check if already assigned
  const existing = await prisma.doctorClinic.findUnique({
    where: {
      doctorId_clinicId: {
        doctorId,
        clinicId: parseInt(clinicId)
      }
    }
  });

  if (existing) {
    throw new ConflictError('You are already assigned to this clinic');
  }

  // Validate consultation fee
  if (consultationFee && (consultationFee < 0 || isNaN(consultationFee))) {
    throw new ValidationError('Consultation fee must be a valid positive number');
  }

  const doctorClinic = await prisma.doctorClinic.create({
    data: {
      doctorId,
      clinicId: parseInt(clinicId),
      consultationFee: consultationFee ? parseFloat(consultationFee) : null
    },
    include: {
      clinic: true
    }
  });

  ResponseHelper.created({
    message: 'Clinic assignment created successfully',
    assignment: {
      id: doctorClinic.id,
      clinic: {
        id: doctorClinic.clinic.id,
        name: doctorClinic.clinic.name,
        city: doctorClinic.clinic.city,
        area: doctorClinic.clinic.area,
        address: doctorClinic.clinic.address,
        phone: doctorClinic.clinic.phone
      },
      consultationFee: doctorClinic.consultationFee,
      assignedAt: doctorClinic.createdAt
    }
  }, res);
});

/**
 * Get doctor's own clinics
 */
const getMyClinics = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;

  const doctorClinics = await prisma.doctorClinic.findMany({
    where: { doctorId },
    orderBy: { createdAt: 'asc' },
    include: {
      clinic: true,
      schedules: {
        where: { isActive: true },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  });

  // Get appointment counts for each clinic
  const clinicsWithStats = await Promise.all(
    doctorClinics.map(async (dc) => {
      const [totalAppointments, upcomingAppointments] = await Promise.all([
        prisma.appointment.count({
          where: {
            doctorId,
            clinicId: dc.clinicId
          }
        }),
        prisma.appointment.count({
          where: {
            doctorId,
            clinicId: dc.clinicId,
            dateTime: {
              gte: new Date()
            },
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          }
        })
      ]);

      return {
        id: dc.id,
        clinic: {
          id: dc.clinic.id,
          name: dc.clinic.name,
          city: dc.clinic.city,
          area: dc.clinic.area,
          address: dc.clinic.address,
          phone: dc.clinic.phone,
          mapUrl: dc.clinic.mapUrl
        },
        consultationFee: dc.consultationFee,
        activeSchedules: dc.schedules.length,
        schedules: dc.schedules.map(s => ({
          id: s.id,
          dayOfWeek: getDayName(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime
        })),
        statistics: {
          totalAppointments,
          upcomingAppointments
        },
        assignedAt: dc.createdAt
      };
    })
  );

  ResponseHelper.success({
    totalClinics: clinicsWithStats.length,
    clinics: clinicsWithStats
  }, res);
});

/**
 * Update doctor's clinic assignment (consultation fee)
 */
const updateMyClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { doctorClinicId } = req.params;
  const { consultationFee } = req.body;

  // Verify ownership
  const doctorClinic = await prisma.doctorClinic.findUnique({
    where: { id: parseInt(doctorClinicId) },
    include: { clinic: true }
  });

  if (!doctorClinic) {
    throw new NotFoundError('Clinic assignment not found');
  }

  if (doctorClinic.doctorId !== doctorId) {
    throw new ValidationError('You can only update your own clinic assignments');
  }

  // Validate consultation fee
  if (consultationFee !== undefined && (consultationFee < 0 || isNaN(consultationFee))) {
    throw new ValidationError('Consultation fee must be a valid positive number');
  }

  const updated = await prisma.doctorClinic.update({
    where: { id: parseInt(doctorClinicId) },
    data: { 
      consultationFee: consultationFee !== undefined ? parseFloat(consultationFee) : undefined 
    },
    include: { clinic: true }
  });

  ResponseHelper.success({
    message: 'Clinic assignment updated successfully',
    assignment: {
      id: updated.id,
      clinic: {
        id: updated.clinic.id,
        name: updated.clinic.name
      },
      consultationFee: updated.consultationFee
    }
  }, res);
});

/**
 * Remove doctor's clinic assignment
 */
const removeMyClinic = asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  const doctorId = req.user.doctor.id;
  const { doctorClinicId } = req.params;

  // Verify ownership
  const doctorClinic = await prisma.doctorClinic.findUnique({
    where: { id: parseInt(doctorClinicId) },
    include: {
      schedules: true
    }
  });

  if (!doctorClinic) {
    throw new NotFoundError('Clinic assignment not found');
  }

  if (doctorClinic.doctorId !== doctorId) {
    throw new ValidationError('You can only remove your own clinic assignments');
  }

  // Check for active schedules
  if (doctorClinic.schedules.length > 0) {
    throw new ValidationError(
      `Cannot remove clinic with ${doctorClinic.schedules.length} active schedule(s). Delete schedules first.`
    );
  }

  // Check for upcoming appointments
  const upcomingAppointments = await prisma.appointment.count({
    where: {
      doctorId,
      clinicId: doctorClinic.clinicId,
      dateTime: {
        gte: new Date()
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    }
  });

  if (upcomingAppointments > 0) {
    throw new ValidationError(
      `Cannot remove clinic with ${upcomingAppointments} upcoming appointment(s). Cancel or complete them first.`
    );
  }

  await prisma.doctorClinic.delete({
    where: { id: parseInt(doctorClinicId) }
  });

  ResponseHelper.success({
    message: 'Clinic assignment removed successfully'
  }, res);
});

// Helper function
function getDayName(dayOfWeek) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export { 
  addMyClinic, 
  getMyClinics, 
  updateMyClinic,
  removeMyClinic
};
