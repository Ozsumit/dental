"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import {
  Plus,
  Search,
  MoreVertical,
  Shield,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  User as UserIcon,
  X,
  Loader2
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveUser, toggleUserStatus, deleteUser } from "@/app/actions/userActions";

export default function StaffClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const filteredUsers = initialUsers.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesRole = activeRole === "ALL" || user.role === activeRole;

    return matchesSearch && matchesRole;
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const saveMutation = useMutation({
    mutationFn: ({ formData, id }: { formData: FormData, id?: string }) => saveUser(formData, id),
    onSuccess: () => {
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  const roles = ["ALL", "ADMIN", "DOCTOR", "RECEPTIONIST"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Staff Management</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Manage your team members and their access levels.</p>
        </div>
        <button
          onClick={() => { setSelectedUser(null); setIsFormOpen(true); }}
          className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-brand-100"
        >
          <Plus className="w-5 h-5" /> Add New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                activeRole === role
                  ? "bg-brand-700 text-white shadow-md"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-brand-200 hover:text-brand-700"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-5">Staff Member</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Date Joined</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-black">
                        {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.fullName || user.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`py-1 px-3 rounded-lg text-[10px] font-black border ${
                      user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-100' :
                      user.role === 'DOCTOR' ? 'bg-brand-50 text-brand-700 border-brand-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => statusMutation.mutate(user.id)}
                      disabled={user.role === 'ADMIN' || statusMutation.isPending}
                      className={`flex items-center gap-2 transition ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {user.status === 'ACTIVE' ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      <span className="text-xs font-bold uppercase tracking-widest">{user.status}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setSelectedUser(user); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                    No staff members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedUser ? 'Edit Staff' : 'Add New Staff'}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Team Member Details</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form action={(fd) => saveMutation.mutate({ formData: fd, id: selectedUser?.id })} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                  <input
                    name="fullName"
                    defaultValue={selectedUser?.fullName || ''}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Username</label>
                  <input
                    name="username"
                    defaultValue={selectedUser?.username}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Role</label>
                  <select
                    name="role"
                    defaultValue={selectedUser?.role || 'RECEPTIONIST'}
                    disabled={selectedUser?.role === 'ADMIN'}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-700"
                  >
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="DOCTOR">DOCTOR</option>
                    {selectedUser?.role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={selectedUser?.email || ''}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Password {selectedUser && '(Leave blank to keep current)'}</label>
                  <input
                    name="password"
                    type="password"
                    required={!selectedUser}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-2 px-8 py-4 bg-brand-700 text-white font-black rounded-2xl hover:bg-brand-800 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-100"
                >
                  {saveMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                  {selectedUser ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
