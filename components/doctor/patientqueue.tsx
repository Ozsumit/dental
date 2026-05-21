import Link from "next/link";
import { Patient } from "@/lib/types/index";
import { StatusBadge } from "@/components/ui/statusbadge";

interface PatientQueueTableProps {
    pendingPatients: Patient[];
    completedPatients: Patient[];
}

export function PatientQueueTable({ pendingPatients, completedPatients }: PatientQueueTableProps) {
    const totalPending = pendingPatients.length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Today&apos;s Patient Queue</h2>
                    <p className="text-xs no-underline text-slate-400 font-medium mt-0.5">Quick list of patient states scheduled for review</p>
                </div>
                <span className="px-3 py-1 text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 rounded-full uppercase tracking-wider">
                    Queue Size: {totalPending} Pending
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-8 py-5">Patient Name</th>
                            <th className="px-8 py-5">Contact No</th>
                            <th className="px-8 py-5">Appointment Info</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Render Pending queue */}
                        {pendingPatients.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition group">
                                <td className="px-8 py-4 font-bold text-slate-900">
                                    {p.firstName} {p.lastName}
                                </td>
                                <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                                <td className="px-8 py-4 text-slate-500 font-medium">
                                    {p.appointments?.[0]?.treatments || "Consultation"}
                                </td>
                                <td className="px-8 py-4">
                                    <StatusBadge status="Pending" />
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <Link
                                        href={`/doctor/clinical-workspace?patientId=${p.id}`}
                                        className="inline-flex bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
                                    >
                                        Start Review
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {/* Render Completed queue */}
                        {completedPatients.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition group opacity-75">
                                <td className="px-8 py-4 font-bold text-slate-900">
                                    {p.firstName} {p.lastName}
                                </td>
                                <td className="px-8 py-4 font-medium text-slate-600">{p.phone}</td>
                                <td className="px-8 py-4 text-slate-500 font-medium">
                                    {p.appointments?.[0]?.treatments || "Consultation"}
                                </td>
                                <td className="px-8 py-4">
                                    <StatusBadge status="Finalized" />
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <Link
                                        href={`/doctor/clinical-workspace?patientId=${p.id}`}
                                        className="inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition"
                                    >
                                        View Assessment
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {pendingPatients.length === 0 && completedPatients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium">
                                    No appointments or patients scheduled for today.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}