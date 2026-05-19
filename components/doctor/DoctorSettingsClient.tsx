"use client";

import { useState, useTransition } from "react";
import {
  updateDoctorProfile,
  updateDoctorNotifications,
  updateDoctorSecurity,
} from "@/app/actions/doctorSettingsActions";
import { Loader2, Code2, Check, AlertCircle } from "lucide-react";

interface DoctorProfileData {
  id: string;
  username: string;
  fullName: string | null;
  dateOfBirth: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  nmcRegNo: string | null;
  photoUrl: string | null;
  notifyAppointment: boolean;
  notifyWaiting: boolean;
  notifyLabResults: boolean;
  notifyDraftReminder: boolean;
  notifyDailySummary: boolean;
  requireOtp: boolean;
  tenantId: string;
}

export default function DoctorSettingsClient({
  initialProfile,
}: {
  initialProfile: DoctorProfileData;
}) {
  const [profile, setProfile] = useState<DoctorProfileData>(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [username, setUsername] = useState(profile.username || "");
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [email, setEmail] = useState(profile.email || "");
  const [specialization, setSpecialization] = useState(profile.specialization || "");
  const [nmcRegNo, setNmcRegNo] = useState(profile.nmcRegNo || "");

  // Notification states
  const [notifs, setNotifs] = useState({
    notifyAppointment: profile.notifyAppointment,
    notifyWaiting: profile.notifyWaiting,
    notifyLabResults: profile.notifyLabResults,
    notifyDraftReminder: profile.notifyDraftReminder,
    notifyDailySummary: profile.notifyDailySummary,
  });

  // Security OTP state
  const [requireOtp, setRequireOtp] = useState(profile.requireOtp);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Frontend validation:
    if (!username || !username.trim()) {
      setMessage({ type: "error", text: "Username is required." });
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("fullName", fullName);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("specialization", specialization);
    formData.append("nmcRegNo", nmcRegNo);

    startTransition(async () => {
      const res = await updateDoctorProfile(formData);
      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          username,
          fullName,
          dateOfBirth,
          phone,
          email,
          specialization,
          nmcRegNo,
        }));
        setMessage({ type: "success", text: "Personal & Contact details saved successfully." });
      } else {
        setMessage({ type: "error", text: res.error || "Something went wrong." });
      }
    });
  };

  const handleToggleNotif = async (key: keyof typeof notifs) => {
    const newVal = !notifs[key];
    const updatedNotifs = { ...notifs, [key]: newVal };
    setNotifs(updatedNotifs);

    startTransition(async () => {
      const res = await updateDoctorNotifications(updatedNotifs);
      if (res.success) {
        setProfile((prev) => ({ ...prev, ...updatedNotifs }));
      } else {
        // Revert
        setNotifs(notifs);
        setMessage({ type: "error", text: res.error || "Failed to update notification settings." });
      }
    });
  };

  const handleToggleOtp = async () => {
    const newVal = !requireOtp;
    setRequireOtp(newVal);

    const formData = new FormData();
    formData.append("requireOtp", newVal.toString());

    startTransition(async () => {
      const res = await updateDoctorSecurity(formData);
      if (res.success) {
        setProfile((prev) => ({ ...prev, requireOtp: newVal }));
      } else {
        // Revert
        setRequireOtp(!newVal);
        setMessage({ type: "error", text: res.error || "Failed to update OTP settings." });
      }
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!passwordForm.newPassword) {
      setPassError("New password cannot be empty.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    const formData = new FormData();
    formData.append("newPassword", passwordForm.newPassword);
    formData.append("requireOtp", requireOtp.toString());

    startTransition(async () => {
      const res = await updateDoctorSecurity(formData);
      if (res.success) {
        setPassSuccess("Password updated successfully!");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPassError(res.error || "Failed to change password.");
      }
    });
  };

  // Get initials for profile banner
  const getInitials = () => {
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return profile.username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[960px] mx-auto p-8 space-y-6 font-sans antialiased text-slate-800 animate-in fade-in duration-300">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <div className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg text-slate-500 cursor-pointer transition">
          <Code2 className="w-5 h-5" />
        </div>
      </div>

      {/* Alert Messaging */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-teal-50 border-teal-200 text-teal-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Section 1: Doctor Profile */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Doctor Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-900 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
              {getInitials()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">{fullName || profile.username}</h3>
              <p className="text-sm text-slate-500 font-medium">
                {specialization || "Physiotherapist"} · Nepal General Hospital
              </p>
              
              {/* Tags */}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">
                  NMC Reg: {nmcRegNo || "12847"}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">
                  Dept: {specialization || "Physiotherapy"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <button className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold px-4 py-2 border border-slate-200 rounded-lg text-sm transition">
            Edit Photo
          </button>
        </div>
      </div>

      {/* Section 2: Personal & Contact Details */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Personal & Contact Details</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Username */}
           

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Priya Thapa"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 9801234567"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.thapa@aashas.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Physiotherapy"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

            {/* NMC Reg. Number */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                NMC Reg. Number
              </label>
              <input
                type="text"
                value={nmcRegNo}
                onChange={(e) => setNmcRegNo(e.target.value)}
                placeholder="12847"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition-all"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setUsername(profile.username || "");
                setFullName(profile.fullName || "");
                setDateOfBirth(profile.dateOfBirth || "");
                setPhone(profile.phone || "");
                setEmail(profile.email || "");
                setSpecialization(profile.specialization || "");
                setNmcRegNo(profile.nmcRegNo || "");
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Notification Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">Notification Preferences</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Control what alerts you receive</p>
        </div>
        <div className="divide-y divide-slate-100 p-6 space-y-4">
          
          {/* New Appointment Booked */}
          <div className="flex items-center justify-between pb-3">
            <div>
              <p className="text-sm font-bold text-slate-900">New Appointment Booked</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Notify when patient books via portal</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyAppointment")}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                notifs.notifyAppointment ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyAppointment ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Patient Waiting Alert */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Patient Waiting Alert</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Alert when patient status changes to Waiting</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyWaiting")}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                notifs.notifyWaiting ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyWaiting ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Lab Results Available */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Lab Results Available</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Notify when lab uploads a result</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyLabResults")}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                notifs.notifyLabResults ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyLabResults ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Draft Assessment Reminder */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Draft Assessment Reminder</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Remind to complete saved drafts after 24h</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyDraftReminder")}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                notifs.notifyDraftReminder ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyDraftReminder ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Daily Schedule Summary */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Daily Schedule Summary</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Morning digest of appointments at 7AM</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyDailySummary")}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                notifs.notifyDailySummary ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyDailySummary ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

        </div>
      </div>

      {/* Section 4: Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">Security</h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Password and access settings</p>
        </div>
        <div className="p-6 space-y-4">
            {/* Change Username */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Username</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Your unique login identifier</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="doctor123"
                  required
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-700 outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={handleProfileSubmit}
                  disabled={isPending || username === profile.username}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          {/* Password Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-900">Password</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Last changed 30 days ago</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-sm transition"
            >
              Change Password
            </button>
          </div>

          {/* Require OTP toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-bold text-slate-900">Require OTP on every login</p>
            </div>
            <button
              onClick={handleToggleOtp}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 ${
                requireOtp ? "bg-brand-700" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  requireOtp ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

        </div>
      </div>

      {/* Password Change Dialog Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-xl border border-slate-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-950">Change Password</h3>
            
            {passError && <p className="text-xs text-red-600 font-semibold">{passError}</p>}
            {passSuccess && <p className="text-xs text-teal-600 font-semibold">{passSuccess}</p>}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white outline-none focus:ring-1 focus:ring-brand-700"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white outline-none focus:ring-1 focus:ring-brand-700"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassError("");
                    setPassSuccess("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand-850 hover:bg-brand-900 bg-brand-800 text-white text-sm font-semibold rounded-lg flex items-center gap-1 transition"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
