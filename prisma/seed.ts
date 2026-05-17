import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing database...");
  await prisma.appointment.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creating initial users...");
  const adminPassword = await bcrypt.hash("adminpassword", 10);
  const doctorPassword = await bcrypt.hash("doctorpassword", 10);
  const receptionistPassword = await bcrypt.hash("receptionistpassword", 10);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const doctor = await prisma.user.create({
    data: {
      username: "doctor",
      password: doctorPassword,
      role: "DOCTOR",
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      username: "receptionist",
      password: receptionistPassword,
      role: "RECEPTIONIST",
    },
  });

  const TOTAL_RECORDS = 50;
  const TREATMENT_OPTIONS = [
    "Cleaning",
    "Checkup",
    "Filling",
    "Root Canal",
    "Whitening",
    "Extraction",
    "X-Ray",
    "Braces",
  ];

  console.log(`🚀 Seeding ${TOTAL_RECORDS} patients...`);

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const gender = faker.helpers.arrayElement(["Male", "Female", "Other"] as const);
    const firstName = faker.person.firstName(gender === "Other" ? undefined : (gender.toLowerCase() as "male" | "female"));
    const lastName = faker.person.lastName();

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone: faker.phone.number({ style: "national" }),
        email: faker.internet.email(),
        dateOfBirth: faker.date.birthdate({ min: 10, max: 80, mode: "age" }),
        gender,
        status: "ACTIVE",
        address: faker.location.streetAddress(),
        bloodGroup: faker.helpers.arrayElement(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        role: faker.helpers.arrayElement(["VIP", "Regular", "New"]),
        visitCount: faker.number.int({ min: 1, max: 6 }),
        lastVisitDate: faker.date.recent({ days: 30 }),
      },
    });

    // Create Medical Record
    await prisma.medicalRecord.create({
      data: {
        patientId: patient.id,
        assignedDoctorId: doctor.id,
        complaints: faker.lorem.sentence(),
        insurance: "HealthCare Plus",
        insuranceNo: faker.string.alphanumeric(10),
        emergencyContactName: faker.person.fullName(),
        emergencyContactNo: faker.phone.number({ style: "national" }),
        status: "STABLE",
        title: "Routine Patient",
      },
    });

    // Create Diagnosis
    await prisma.diagnosis.create({
      data: {
        patientId: patient.id,
        currentComplaint: "Slight toothache",
        pastHistory: "No major surgeries",
        medicalHistory: JSON.stringify(["Hypertension", "Asthma"].slice(0, faker.number.int({min:0, max:2}))),
      },
    });

    // Create some appointments
    const appointmentDate = i < 5 ? new Date() : faker.date.future(); // First 5 patients have appointments today
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        appointmentDate,
        status: i < 5 ? "SCHEDULED" : "COMPLETED",
        treatments: faker.helpers.arrayElement(TREATMENT_OPTIONS),
      },
    });

    // Create some procedures
    await prisma.procedure.create({
      data: {
        patientId: patient.id,
        name: faker.helpers.arrayElement(TREATMENT_OPTIONS),
        cost: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
        procedureDate: faker.date.past(),
        medicine: JSON.stringify(["Amoxicillin", "Paracetamol"]),
        suggestions: JSON.stringify(["Avoid cold drinks", "Brush twice daily"]),
      },
    });
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
