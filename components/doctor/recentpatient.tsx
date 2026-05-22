"use client";

import { Patient } from "@/lib/types/index";
import { Card } from "@/components/ui/Card";

interface RecentTreatmentsTimelineProps {
  completedPatients: Patient[];
}

export function RecentTreatmentsTimeline({
  completedPatients,
}: RecentTreatmentsTimelineProps) {
  // Helper function to dynamically output relative time (e.g., "10:30 AM", "Yesterday", "2 days ago")
  const formatRelativeTime = (dateInput?: string | Date) => {
    if (!dateInput) return "Completed";
    const date = new Date(dateInput);
    const now = new Date();

    // Reset clock to calculate absolute day differences
    const dateMidnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const nowMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const diffTime = nowMidnight.getTime() - dateMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays > 1) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Convert the Patient list into timeline records
  const timelineItems = completedPatients.map((patient) => {
    // Extract the completed appointment
    const appointment = patient.appointments?.[0];

    // Safely extract tooth designation if stored in the appointment, otherwise fallback
    const toothNumber =
      (appointment as any)?.toothNumber ||
      (appointment as any)?.tooth ||
      "General";

    // Primary timestamp source is now patient.lastVisitDate (synced with the prisma update)
    const timestampSource =
      (patient as any).lastVisitDate ||
      appointment?.updatedAt ||
      appointment?.startTime;

    return {
      id: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      toothNumber,
      treatmentName: appointment?.treatments || "General Consultation",
      timeLabel: formatRelativeTime(timestampSource),
    };
  });

  return (
    <Card title="Recent Treatments">
      <div className="mt-6 flex flex-col">
        {timelineItems.length > 0 ? (
          timelineItems.map((item, index) => (
            <div key={item.id} className="flex gap-4">
              {/* Timeline track and node point */}
              <div className="flex flex-col items-center relative shrink-0">
                {/* Node point */}
                <div className="w-3.5 h-3.5 rounded-full bg-[#085a75] mt-5 z-10 shrink-0" />

                {/* Vertical path line between nodes */}
                {index !== timelineItems.length - 1 && (
                  <div className="w-[2px] bg-slate-200 grow -my-2" />
                )}
              </div>

              {/* Content card */}
              <div className="flex-1 pb-4">
                <div className="bg-[#fcfdfe] hover:bg-slate-50 border border-slate-100 border-l-[4px] border-l-[#085a75] rounded-[4px] p-4  transition duration-200">
                  {/* Upper line: Patient Name & Timestamp */}
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-[15px] text-slate-800 tracking-tight">
                      {item.patientName}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-400">
                      {item.timeLabel}
                    </span>
                  </div>

                  {/* Lower line: Tooth Index badge & Treatment name */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100/50 rounded-full tracking-wider">
                      #{item.toothNumber}
                    </span>
                    <p className="text-xs font-bold text-slate-500 tracking-wide">
                      {item.treatmentName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium">
              No completed treatments recorded for today.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
