-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Patient_firstName_lastName_idx" ON "Patient"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");
