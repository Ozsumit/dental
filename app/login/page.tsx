"use client";

import { login } from "@/app/actions/authActions";
import { useState } from "react";
import { Activity } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">DentalCRM</h1>
        </div>
        <h2 className="text-xl font-semibold text-center text-slate-700 mb-6">
          Login to your account
        </h2>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              name="username"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="receptionist / doctor / admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
          >
            Sign In
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>Demo credentials:</p>
          <p>admin / adminpassword</p>
          <p>doctor / doctorpassword</p>
          <p>receptionist / receptionistpassword</p>
        </div>
      </div>
    </div>
  );
}
