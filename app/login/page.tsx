"use client";

import { login } from "@/app/actions/authActions";
import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // IMPORTANT

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-slate-600 p-2 rounded-lg text-white">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">DentalCRM</h1>
        </div>

        <h2 className="text-xl font-semibold text-center text-slate-700 mb-6">
          Login to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50"
            placeholder="receptionist / doctor / admin"
          />

          <input
            name="password"
            type="password"
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50"
            placeholder="••••••••"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00886a] text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
       <p className="mt-4 text-sm text-slate-500">demo cred: admin: admin/12345, doctor: sumit/12345, receptionist: receptionist/12345</p>
      </div>
    </div>
  );
}
