import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing database...");
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();

  const TOTAL_RECORDS = 8000;
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

  // 4. Prepare Appointment Data
  console.log("🔗 Linking appointments...");
  const appointmentsData = allPatients.flatMap((patient) => {
    return Array.from({ length: patient.visitCount }).map(() => ({
      patientId: patient.id,
      appointmentDate: faker.date.past({ years: 2 }),
      status: "COMPLETED",
      treatments: faker.helpers.arrayElements(TREATMENT_OPTIONS, {
        min: 1,
        max: 3,
      }),
    }));
  });

  // 5. Bulk Insert Appointments (In chunks to avoid packet size limits)
  const CHUNK_SIZE = 5000;
  for (let i = 0; i < appointmentsData.length; i += CHUNK_SIZE) {
    await prisma.appointment.createMany({
      data: appointmentsData.slice(i, i + CHUNK_SIZE),
    });
  }

  console.log("🎉 Seeding complete in seconds!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
