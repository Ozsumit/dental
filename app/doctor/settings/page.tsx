import SettingsClient from "@/components/shared/SettingsClient";
import { getDoctorProfile } from "@/app/actions/doctorSettingsActions";
import { redirect } from "next/navigation";

export default async function DoctorSettingsPage() {
  const profile = await getDoctorProfile();
  if (!profile) {
    redirect("/login");
  }

  // Format date of birth to YYYY-MM-DD for input field
  const formattedProfile = {
    ...profile,
    dateOfBirth: profile.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
      : "",
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto">
      <SettingsClient initialProfile={formattedProfile as any} role="DOCTOR" />
    </div>
  );
}
