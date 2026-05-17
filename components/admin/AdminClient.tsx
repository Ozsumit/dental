"use client";

import { useState } from "react";
import { saveUser, deleteUser } from "@/app/actions/userActions";
import { Plus, Edit2, Trash2, X, Shield, User as UserIcon } from "lucide-react";
import { User } from "@prisma/client";

export default function AdminClient({ users }: { users: User[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Manage system users and role assignments</p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setIsFormOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
            <tr>
              <th className="px-6 py-5">User</th>
              <th className="px-6 py-5">Role</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="bg-slate-100 p-2.5 rounded-full text-slate-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-900">{user.username}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`py-1 px-3 rounded-full text-xs font-bold border ${
                    user.role === "ADMIN" ? "bg-red-50 text-red-700 border-red-200" :
                    user.role === "DOCTOR" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setSelectedUser(user); setIsFormOpen(true); }}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => { if(confirm("Are you sure?")) await deleteUser(user.id); }}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedUser ? "Update User" : "Create New User"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData) => {
                await saveUser(formData, selectedUser?.id);
                setIsFormOpen(false);
              }}
              className="p-6 space-y-5"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                <input
                  required
                  name="username"
                  defaultValue={selectedUser?.username}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {selectedUser ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input
                  required={!selectedUser}
                  name="password"
                  type="password"
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={selectedUser ? "••••••••" : ""}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select
                  name="role"
                  defaultValue={selectedUser?.role || "RECEPTIONIST"}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white"
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
