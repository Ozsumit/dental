"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, User, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Appointment, ExtendedAppointment } from "@/lib/types";
import { StatusBadge } from "@/components/ui/statusbadge";


interface AppointmentsTableProps {
    appointments: ExtendedAppointment[];
    currentPage: number;
    totalPages: number;
    onEdit: (appt: ExtendedAppointment) => void;
    onDelete: (appt: ExtendedAppointment) => void;
}

export function AppointmentsTable({
    appointments,
    currentPage,
    totalPages,
    onEdit,
    onDelete,
}: AppointmentsTableProps) {
    const router = useRouter();
    const params = useSearchParams();

    const updatePageQuery = (page: number) => {
        const newParams = new URLSearchParams(params.toString());
        newParams.set("page", String(page));
        router.push(`?${newParams.toString()}`);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-5">Date & Time</th>
                        <th className="px-6 py-5">Patient</th>
                        <th className="px-6 py-5">Treatment</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {appointments.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                                No appointments found.
                            </td>
                        </tr>
                    ) : (
                        appointments.map((appt: ExtendedAppointment) => {
                            const dateStr = new Date(appt.appointmentDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                            });

                            return (
                                <tr key={appt.id} className="hover:bg-slate-50 transition group">
                                    <td className="px-6 py-4 font-bold text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-brand-500" />
                                            {dateStr}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium ml-6 uppercase">
                                            Scheduled at{" "}
                                            {new Date(appt.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-slate-900">
                                            <User className="w-4 h-4 text-slate-400" /> {appt.patient?.firstName} {appt.patient?.lastName}
                                        </div>
                                        <div className="text-xs text-slate-500 ml-6">
                                            {appt.patient?.phone} • <span className="text-brand-600 font-bold">{appt.patient?.role}</span>
                                            {appt.doctor && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <span className="text-brand-600 font-bold">
                                                        Dr. {appt.doctor.fullName || appt.doctor.username}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{appt.treatments}</div>
                                        <div className="text-[10px] text-slate-400 italic">
                                            Previous visits: {appt.patient?.visitCount}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={appt.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => onEdit(appt)}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(appt)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-500 font-medium">
                    Page <span className="text-slate-900">{currentPage}</span> of{" "}
                    <span className="text-slate-900">{totalPages || 1}</span>
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => updatePageQuery(currentPage - 1)}
                        className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => updatePageQuery(currentPage + 1)}
                        className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>
        </div>
    );
}