import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing database...");
  await prisma.appointment.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Creating initial users...");
  const adminPassword = await bcrypt.hash("adminpassword", 10);
  const doctorPassword = await bcrypt.hash("doctorpassword", 10);
  const receptionistPassword = await bcrypt.hash("receptionistpassword", 10);

  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        password: adminPassword,
        role: "ADMIN",
      },
      {
        username: "doctor",
        password: doctorPassword,
        role: "DOCTOR",
      },
      {
        username: "receptionist",
        password: receptionistPassword,
        role: "RECEPTIONIST",
      },
    ],
  });

  const TOTAL_RECORDS = 100; // Reduced for SQLite and speed
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

  console.log(`🚀 Fast seeding ${TOTAL_RECORDS} patients...`);

  // 1. Prepare Patient Data
  const patientsData = Array.from({ length: TOTAL_RECORDS }).map(() => {
    const gender = faker.helpers.arrayElement([
      "Male",
      "Female",
      "Other",
    ] as const);
    return {
      firstName: faker.person.firstName(
        gender === "Other"
          ? undefined
          : (gender.toLowerCase() as "male" | "female"),
      ),
      lastName: faker.person.lastName(),
      phone: faker.phone.number({ style: "national" }),
      email: faker.internet.email(),
      dateOfBirth: faker.date.birthdate({ min: 10, max: 80, mode: "age" }),
      gender,
      status: "ACTIVE",
      visitCount: faker.number.int({ min: 1, max: 6 }),
      lastVisitDate: faker.date.recent({ days: 30 }),
    };
  });

  // 2. Bulk Insert Patients
  await prisma.patient.createMany({ data: patientsData });

  // 3. Fetch all newly created patients to link appointments
  const allPatients = await prisma.patient.findMany({
    select: { id: true, visitCount: true },
  });

  // 4. Prepare Appointment & Procedure Data
  console.log("🔗 Linking appointments and procedures...");
  const appointmentsData = allPatients.flatMap((patient) => {
    return Array.from({ length: patient.visitCount }).map(() => ({
      patientId: patient.id,
      appointmentDate: faker.date.past({ years: 2 }),
      status: "COMPLETED",
      treatments: faker.helpers
        .arrayElements(TREATMENT_OPTIONS, {
          min: 1,
          max: 3,
        })
        .join(", "),
    }));
  });

  const proceduresData = allPatients.flatMap((patient) => {
    return Array.from({ length: faker.number.int({ min: 0, max: 2 }) }).map(
      () => ({
        patientId: patient.id,
        name: faker.helpers.arrayElement(TREATMENT_OPTIONS),
        description: faker.lorem.sentence(),
        cost: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
        procedureDate: faker.date.past({ years: 1 }),
      }),
    );
  });

  // 5. Bulk Insert Appointments and Procedures
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < appointmentsData.length; i += CHUNK_SIZE) {
    await prisma.appointment.createMany({
      data: appointmentsData.slice(i, i + CHUNK_SIZE),
    });
  }

  for (let i = 0; i < proceduresData.length; i += CHUNK_SIZE) {
    await prisma.procedure.createMany({
      data: proceduresData.slice(i, i + CHUNK_SIZE),
    });
  }

  console.log("🎉 Seeding complete in seconds!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
