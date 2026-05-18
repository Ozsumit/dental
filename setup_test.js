
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  if (!doctor) throw new Error('No doctor found');

  const existing = await prisma.patient.findFirst({ where: { phone: '555-TEST' } });
  let patient;
  if (existing) {
    patient = existing;
  } else {
    patient = await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient',
        phone: '555-TEST',
        dateOfBirth: new Date('1990-01-01'),
        status: 'ACTIVE'
      }
    });
  }

  const today = new Date();
  const start = new Date(today);
  start.setHours(10, 0, 0, 0);

  // Delete existing appointments for this patient today to avoid duplicates
  const startToday = new Date(today);
  startToday.setHours(0,0,0,0);
  const endToday = new Date(today);
  endToday.setHours(23,59,59,999);

  await prisma.appointment.deleteMany({
    where: {
      patientId: patient.id,
      appointmentDate: { gte: startToday, lte: endToday }
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: start,
      status: 'SCHEDULED',
      treatments: 'Testing Overhaul'
    }
  });
  console.log('Test data created for patient: ' + patient.id + ' with doctor: ' + doctor.id);
}
main().finally(() => prisma.$disconnect());
