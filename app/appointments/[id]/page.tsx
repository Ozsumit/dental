import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TREATMENT_OPTIONS: string[] = [
  "Cleaning",
  "Filling",
  "Extraction",
  "Root Canal",
];

async function updateAppointmentProceduresAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string | null;
  const treatments = formData.getAll("treatments").map((v) => String(v));
  const notes = (formData.get("notes") as string) || undefined;
  if (!id) return;
  await prisma.appointment.update({
    where: { id },
    data: { treatments, notes },
  });
}

export default async function AppointmentDetails({
  params,
}: {
  params: { id: string };
}) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { patient: true },
  });
  if (!appointment) return <div>Appointment not found</div>;

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold">
        Session for {appointment.patient.firstName}
      </h1>
      <form action={updateAppointmentProceduresAction}>
        <input type="hidden" name="id" value={appointment.id} />

        <div className="grid grid-cols-4 gap-4 mt-6">
          {TREATMENT_OPTIONS.map((t: string) => (
            <label
              key={t}
              className="p-4 border rounded-xl flex items-center gap-2"
            >
              <input
                type="checkbox"
                name="treatments"
                value={t}
                defaultChecked={appointment.treatments.includes(t)}
              />
              {t}
            </label>
          ))}
        </div>
        <textarea
          name="notes"
          placeholder="Doctor's notes..."
          className="w-full mt-4 p-4 border rounded-xl"
        />
        <button className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl">
          Save Session Details
        </button>
      </form>
    </div>
  );
}
