"use client";

import { useState } from "react";
import { Loader2, Code2, Check, AlertCircle, Shield, Bell, User as UserIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { validateProfileForm, validatePasswordForm } from "@/services/validations";

// Import all actions and call dynamically based on role
import {
  updateDoctorProfile,
  updateDoctorNotifications,
  updateDoctorSecurity,
} from "@/app/actions/doctorSettingsActions";
import {
  updateReceptionistProfile,
  updateReceptionistNotifications,
  updateReceptionistSecurity,
} from "@/app/actions/receptionistSettingsActions";
import { useMutation } from "@tanstack/react-query";

export interface SettingsProfileData {
  id: string;
  username: string;
  fullName: string | null;
  dateOfBirth: string;
  phone: string | null;
  email: string | null;
  specialization?: string | null;
  nmcRegNo?: string | null;
  photoUrl?: string | null;
  notifyAppointment: boolean;
  notifyWaiting: boolean;
  notifyLabResults?: boolean;
  notifyDraftReminder?: boolean;
  notifyDailySummary: boolean;
  requireOtp: boolean;
  tenantId: string;
}

interface SettingsClientProps {
  initialProfile: SettingsProfileData;
  role: "DOCTOR" | "RECEPTIONIST" | "ADMIN";
}

export default function SettingsClient({ initialProfile, role }: SettingsClientProps) {
  const [profile, setProfile] = useState<SettingsProfileData>(initialProfile);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit details form state
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
    notifyDailySummary: profile.notifyDailySummary,
    ...(role === "DOCTOR"
      ? {
          notifyLabResults: !!profile.notifyLabResults,
          notifyDraftReminder: !!profile.notifyDraftReminder,
        }
      : {}),
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

  const isDoctor = role === "DOCTOR";

  const profileMutation = useMutation({
    mutationFn: (formData: FormData) => isDoctor ? updateDoctorProfile(formData) : updateReceptionistProfile(formData),
    onSuccess: (res, variables) => {
        if (res.success) {
            const updated = Object.fromEntries(variables.entries());
            setProfile((prev) => ({ ...prev, ...updated } as SettingsProfileData));
            setMessage({ type: "success", text: "Personal details saved successfully." });
        } else {
            setMessage({ type: "error", text: res.error || "Something went wrong." });
        }
    }
  });

  const notifMutation = useMutation({
    mutationFn: (updated: any) => isDoctor ? updateDoctorNotifications(updated) : updateReceptionistNotifications(updated),
    onSuccess: (res, variables) => {
        if (res.success) {
            setProfile(prev => ({ ...prev, ...variables }));
            setNotifs(variables);
        } else {
            setNotifs(notifs);
            setMessage({ type: "error", text: res.error || "Update failed." });
        }
    }
  });

  const securityMutation = useMutation({
    mutationFn: (formData: FormData) => isDoctor ? updateDoctorSecurity(formData) : updateReceptionistSecurity(formData),
    onSuccess: (res, variables) => {
        if (res.success) {
            const isPasswordChange = variables.has("newPassword");
            if (isPasswordChange) {
                setPassSuccess("Password updated successfully!");
                setPasswordForm({ newPassword: "", confirmPassword: "" });
                setTimeout(() => setShowPasswordModal(false), 1500);
            } else {
                const newVal = variables.get("requireOtp") === "true";
                setProfile(prev => ({ ...prev, requireOtp: newVal }));
                setRequireOtp(newVal);
            }
        } else {
            const isPasswordChange = variables.has("newPassword");
            if (isPasswordChange) {
                setPassError(res.error || "Failed to change password.");
            } else {
                setRequireOtp(requireOtp);
                setMessage({ type: "error", text: res.error || "Update failed." });
            }
        }
    }
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const profileData = { username, fullName, dateOfBirth, phone, email, ...(isDoctor && { specialization, nmcRegNo }) };
    const err = validateProfileForm(profileData);
    if (err) return setMessage({ type: "error", text: err });

    const formData = new FormData();
    Object.entries(profileData).forEach(([k, v]) => formData.append(k, v as string));
    profileMutation.mutate(formData);
  };

  const handleToggleNotif = async (key: keyof typeof notifs) => {
    const updatedNotifs = { ...notifs, [key]: !notifs[key] };
    notifMutation.mutate(updatedNotifs);
  };

  const handleToggleOtp = async () => {
    const newVal = !requireOtp;
    const formData = new FormData();
    formData.append("requireOtp", newVal.toString());
    securityMutation.mutate(formData);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(""); setPassSuccess("");

    const err = validatePasswordForm(passwordForm);
    if (err) return setPassError(err);

    const formData = new FormData();
    formData.append("newPassword", passwordForm.newPassword);
    formData.append("requireOtp", requireOtp.toString());
    securityMutation.mutate(formData);
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
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Manage your {role.toLowerCase()} profile, notifications, and security settings.
          </p>
        </div>
        <div className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl text-slate-500 cursor-pointer transition">
          <Code2 className="w-5 h-5" />
        </div>
      </div>

      {/* Alert Messaging */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-200 ${
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

      {/* Section 1: Profile banner Card */}
      <Card className="shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className={`w-16 h-16 rounded-full text-white flex items-center justify-center font-black text-2xl shadow-inner ${isDoctor ? "bg-brand-900" : "bg-brand-600"}`}>
              {getInitials()}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 justify-center sm:justify-start">
                <UserIcon className="w-4 h-4 text-brand-600" />
                {role} Profile
              </h2>
              <h3 className="text-xl font-bold text-slate-950">{fullName || profile.username}</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                {isDoctor ? (specialization || "General Dentist") : "Front Desk Coordinator"}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                {isDoctor && nmcRegNo && (
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full border border-teal-100">
                    NMC Reg: {nmcRegNo}
                  </span>
                )}
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isDoctor ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                  {isDoctor ? "Clinical Services" : "Administration & Billing"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <Button variant="outline" size="sm">
              Change Photo
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 2: Personal & Contact Details Card */}
      <Card title="Personal & Contact Details" subtitle="Update your basic account information" className="shadow-sm">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isDoctor ? "Dr. Priya Thapa" : "Priya Thapa"}
            />

            {/* Date of Birth */}
            <Input
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            {/* Phone */}
            <Input
              label="Phone Number"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 9801234567"
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />

            {/* Specialization (Doctor Only) */}
            {isDoctor && (
              <Input
                label="Specialization"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Endodontics, Orthodontics"
              />
            )}

            {/* NMC Registration Number (Doctor Only) */}
            {isDoctor && (
              <Input
                label="NMC Registration Number"
                type="text"
                value={nmcRegNo}
                onChange={(e) => setNmcRegNo(e.target.value)}
                placeholder="12847"
              />
            )}

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUsername(profile.username || "");
                setFullName(profile.fullName || "");
                setDateOfBirth(profile.dateOfBirth || "");
                setPhone(profile.phone || "");
                setEmail(profile.email || "");
                if (isDoctor) {
                  setSpecialization(profile.specialization || "");
                  setNmcRegNo(profile.nmcRegNo || "");
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={profileMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 3: Notification Preferences Card */}
      <Card
        title="Notification Preferences"
        subtitle="Control system alerts and digests"
        className="shadow-sm"
        headerAction={<Bell className="w-5 h-5 text-brand-600" />}
      >
        <div className="divide-y divide-slate-100 space-y-4">
          
          {/* New Appointment Booked */}
          <div className="flex items-center justify-between pb-3 pt-1">
            <div>
              <p className="text-sm font-bold text-slate-900">New Appointment Booked</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Receive alert when patients schedule new appointments</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyAppointment")}
              disabled={notifMutation.isPending}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                notifs.notifyAppointment ? "bg-brand-600" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyAppointment ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Patient Queue Updates */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Patient Queue Updates</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Notify when patient shifts to waiting or starts diagnosis</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyWaiting")}
              disabled={notifMutation.isPending}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                notifs.notifyWaiting ? "bg-brand-600" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  notifs.notifyWaiting ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Lab Results Alert (Doctor Only) */}
          {isDoctor && "notifyLabResults" in notifs && (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Lab Results & Diagnoses</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Notify when lab results are uploaded or finalized</p>
              </div>
              <button
                onClick={() => handleToggleNotif("notifyLabResults")}
                disabled={notifMutation.isPending}
                className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  notifs.notifyLabResults ? "bg-brand-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    notifs.notifyLabResults ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Draft Notes Reminder (Doctor Only) */}
          {isDoctor && "notifyDraftReminder" in notifs && (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Draft Notes Reminders</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Alerts to sign draft clinical records older than 24 hours</p>
              </div>
              <button
                onClick={() => handleToggleNotif("notifyDraftReminder")}
                disabled={notifMutation.isPending}
                className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  notifs.notifyDraftReminder ? "bg-brand-600" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    notifs.notifyDraftReminder ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Daily Schedule Summary */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Daily Queue Summary</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Morning digest of appointments and scheduled tasks at 7AM</p>
            </div>
            <button
              onClick={() => handleToggleNotif("notifyDailySummary")}
              disabled={notifMutation.isPending}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                notifs.notifyDailySummary ? "bg-brand-600" : "bg-slate-200"
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
      </Card>

      {/* Section 4: Security & Login Card */}
      <Card
        title="Security & Login"
        subtitle="Manage credentials and multi-factor settings"
        className="shadow-sm"
        headerAction={<Lock className="w-5 h-5 text-brand-600" />}
      >
        <div className="space-y-4">
          
          {/* Change Username */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Username</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Your unique login identifier</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username123"
                required
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-600 outline-none transition-all font-medium"
              />
              <Button
                type="button"
                variant="primary"
                onClick={handleProfileSubmit}
                disabled={profileMutation.isPending || username === profile.username}
              >
                Save
              </Button>
            </div>
          </div>
          
          {/* Password Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-900">Account Password</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Update and replace secure login password</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>

          {/* Require OTP toggle */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-bold text-slate-900">Require OTP on every login</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Enforce SMS/Email One-Time Password verification for security</p>
            </div>
            <button
              onClick={handleToggleOtp}
              disabled={securityMutation.isPending}
              className={`relative w-[48px] h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                requireOtp ? "bg-brand-600" : "bg-slate-200"
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
      </Card>

      {/* Password Change Dialog Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPassError("");
          setPassSuccess("");
        }}
        title="Change Password"
        icon={<Shield className="w-5 h-5 text-brand-600" />}
      >
        <div className="space-y-4">
          {passError && <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">{passError}</p>}
          {passSuccess && <p className="text-xs text-teal-600 font-bold bg-teal-50 p-2.5 rounded-lg border border-teal-200">{passSuccess}</p>}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              required
              placeholder="••••••••"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              required
              placeholder="••••••••"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassError("");
                  setPassSuccess("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={securityMutation.isPending}
              >
                Confirm Update
              </Button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}
