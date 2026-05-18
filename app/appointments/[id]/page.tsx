import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const TREATMENT_OPTIONS: string[] = [
  "Cleaning",
  "Filling",
  "Extraction",
  "Root Canal",
];

async function updateAppointmentProceduresAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string | null;
  const treatments = formData.getAll("treatments").join(", ");
  if (!id) return;
  await prisma.appointment.update({
    where: { id },
    data: { treatments },
  });
  revalidatePath("/appointments");
}

export default async function AppointmentDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!appointment) return <div>Appointment not found</div>;

  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm max-w-2xl mx-auto mt-10 border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Session for {appointment.patient.firstName} {appointment.patient.lastName}
      </h1>
      <form action={updateAppointmentProceduresAction}>
        <input type="hidden" name="id" value={appointment.id} />

        <div className="grid grid-cols-2 gap-4 mt-6">
          {TREATMENT_OPTIONS.map((t: string) => (
            <label
              key={t}
              className="p-4 border border-slate-200 rounded-xl flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition"
            >
              <input
                type="checkbox"
                name="treatments"
                value={t}
                defaultChecked={appointment.treatments.includes(t)}
                className="w-5 h-5 accent-brand-700"
              />
              <span className="font-medium text-slate-700">{t}</span>
            </label>
          ))}
        </div>

        <button className="mt-8 w-full bg-brand-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-800 transition shadow-md">
          Save Session Details
        </button>
      </form>
    </div>
  );
}
