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
  await prisma.billingCatalog.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🏢 Creating Tenants...");
  const tenantMaster = await prisma.tenant.create({
    data: {
      id: "master",
      name: "DentalCRM System Master",
    },
  });

  const tenant1 = await prisma.tenant.create({
    data: {
      id: "nepal-general",
      name: "Nepal General Hospital",
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      id: "apex-dental",
      name: "Apex Dental Care",
    },
  });

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // Define tenants configuration
  const tenantsConfig = [
    {
      tenant: tenantMaster,
      users: [
        { username: "superadmin", role: "SUPERADMIN" as const },
      ],
      patientCount: 0,
      fee: 0,
      catalog: [],
    },
    {
      tenant: tenant1,
      users: [
        { username: "admin", role: "ADMIN" as const },
        { username: "doctor", role: "DOCTOR" as const },
        { username: "receptionist", role: "RECEPTIONIST" as const },
      ],
      patientCount: 30,
      fee: 250,
      catalog: [
        { name: "Consultation", category: "General", baseCost: 250 },
        { name: "Follow-up Consultation", category: "General", baseCost: 100 },
        { name: "X-Ray Chest", category: "Radiology", baseCost: 500 },
        { name: "Full Blood Count", category: "Laboratory", baseCost: 350 },
        { name: "MRI Scan", category: "Radiology", baseCost: 4500 },
        { name: "Physical Therapy Session", category: "Therapy", baseCost: 600 },
      ],
    },
    {
      tenant: tenant2,
      users: [
        { username: "apexadmin", role: "ADMIN" as const },
        { username: "apexdoctor", role: "DOCTOR" as const },
        { username: "apexreceptionist", role: "RECEPTIONIST" as const },
      ],
      patientCount: 20,
      fee: 300,
      catalog: [
        { name: "Dental Consultation", category: "General", baseCost: 300 },
        { name: "Dental Follow-up", category: "General", baseCost: 150 },
        { name: "Dental Cleaning", category: "Dental", baseCost: 800 },
        { name: "Root Canal Treatment", category: "Dental", baseCost: 5500 },
        { name: "Tooth Extraction", category: "Dental", baseCost: 1200 },
        { name: "Dental X-Ray", category: "Radiology", baseCost: 400 },
      ],
    },
  ];

  const TREATMENT_OPTIONS = [
    "Consultation",
    "Follow-up",
    "Cleaning",
    "Extraction",
    "X-Ray",
    "Therapy",
    "Checkup",
  ];

  for (const config of tenantsConfig) {
    const t = config.tenant;
    console.log(`\n👤 Creating users for ${t.name}...`);
    
    const seededUsers: any[] = [];
    for (const u of config.users) {
      const isDrPriya = u.username === "doctor";
      const doctorData = u.role === "DOCTOR" ? {
        fullName: isDrPriya ? "Dr. Priya Thapa" : "Dr. Apex Doctor",
        specialization: isDrPriya ? "Physiotherapy" : "Dentistry",
        nmcRegNo: isDrPriya ? "12847" : "54321",
        phone: isDrPriya ? "+977 9801234567" : "+977 9801112222",
        email: isDrPriya ? "priya.thapa@aashas.com" : "apex.doctor@apexdental.com",
        dateOfBirth: isDrPriya ? new Date("1988-06-15") : new Date("1985-04-10"),
        notifyAppointment: false,
        notifyWaiting: true,
        notifyLabResults: false,
        notifyDraftReminder: true,
        notifyDailySummary: false,
        requireOtp: false,
      } : {};

      const user = await prisma.user.create({
        data: {
          username: u.username,
          password: defaultPasswordHash,
          role: u.role,
          tenantId: t.id,
          ...doctorData,
        },
      });
      seededUsers.push(user);
    }

    const doctorUser = seededUsers.find(u => u.role === "DOCTOR");

    console.log(`⚙️ Creating system settings for ${t.name}...`);
    await prisma.systemSettings.create({
      data: {
        appointmentFee: config.fee,
        tenantId: t.id,
      },
    });

    console.log(`💳 Creating billing catalog for ${t.name}...`);
    for (const item of config.catalog) {
      await prisma.billingCatalog.create({
        data: {
          ...item,
          tenantId: t.id,
        },
      });
    }

    if (doctorUser && config.patientCount > 0) {
      console.log(`🚀 Seeding ${config.patientCount} patients for ${t.name}...`);
      for (let i = 0; i < config.patientCount; i++) {
        const gender = faker.helpers.arrayElement(["Male", "Female", "Other"] as const);
        const firstName = faker.person.firstName(gender === "Other" ? undefined : (gender.toLowerCase() as "male" | "female"));
        const lastName = faker.person.lastName();
        
        const phone = faker.phone.number({ style: "national" });
        const email = faker.internet.email();

        const patient = await prisma.patient.create({
          data: {
            firstName,
            lastName,
            phone,
            email,
            dateOfBirth: faker.date.birthdate({ min: 10, max: 80, mode: "age" }),
            gender,
            status: "ACTIVE",
            address: faker.location.streetAddress(),
            bloodGroup: faker.helpers.arrayElement(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
            allergies: faker.helpers.arrayElement(["Peanuts", "Penicillin", "None", "Dust", "Latex"]),
            role: faker.helpers.arrayElement(["VIP", "Regular", "New"]),
            visitCount: faker.number.int({ min: 1, max: 6 }),
            isOld: true,
            lastVisitDate: faker.date.recent({ days: 30 }),
            tenantId: t.id,
          },
        });

        // Create Medical Record
        await prisma.medicalRecord.create({
          data: {
            patientId: patient.id,
            assignedDoctorId: doctorUser.id,
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
            currentComplaint: "Mild pain and irritation",
            pastHistory: "No prior operations",
            medicalHistory: JSON.stringify(["Hypertension", "Asthma"].slice(0, faker.number.int({ min: 0, max: 2 }))),
          },
        });

        // Create appointments
        const isToday = i < 5;
        const appointmentDate = isToday ? new Date() : faker.date.future();
        const appt = await prisma.appointment.create({
          data: {
            patientId: patient.id,
            appointmentDate,
            status: isToday ? "SCHEDULED" : "COMPLETED",
            treatments: faker.helpers.arrayElement(TREATMENT_OPTIONS),
            doctorId: doctorUser.id,
            tenantId: t.id,
          },
        });

        // Create procedures
        await prisma.procedure.create({
          data: {
            patientId: patient.id,
            appointmentId: appt.id,
            name: faker.helpers.arrayElement(TREATMENT_OPTIONS),
            cost: parseFloat(faker.commerce.price({ min: 100, max: 800 })),
            procedureDate: faker.date.past(),
            medicine: JSON.stringify(["Amoxicillin", "Paracetamol"]),
            suggestions: JSON.stringify(["Rest well", "Brush twice daily"]),
            status: "PAID",
            tenantId: t.id,
          },
        });
      }
    }
  }

  console.log("\n🎉 Seeding complete! Credentials for all tenants are configured with password 'password123'");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

