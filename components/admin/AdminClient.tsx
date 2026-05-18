"use client";

import { useState } from "react";
import { saveUser, deleteUser } from "@/app/actions/userActions";
import { saveCatalogItem, deleteCatalogItem } from "@/app/actions/billingActions";
import { Plus, Edit2, Trash2, X, Shield, User as UserIcon, Receipt, Briefcase } from "lucide-react";
import { User, BillingCatalog } from "@prisma/client";

export default function AdminClient({ users, catalog }: { users: User[], catalog: BillingCatalog[] }) {
  const [activeTab, setActiveTab] = useState<"Users" | "Catalog">("Users");

  // User states
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Catalog states
  const [isCatalogFormOpen, setIsCatalogFormOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BillingCatalog | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
            <div className="flex gap-4 mt-2">
               <button
                 onClick={() => setActiveTab("Users")}
                 className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Users" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
               >
                  User Management
               </button>
               <button
                 onClick={() => setActiveTab("Catalog")}
                 className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Catalog" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
               >
                  Billing Catalog
               </button>
            </div>
          </div>
        </div>

        {activeTab === "Users" ? (
          <button
            onClick={() => { setSelectedUser(null); setIsUserFormOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add New User
          </button>
        ) : (
          <button
            onClick={() => { setSelectedCatalogItem(null); setIsCatalogFormOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Procedure
          </button>
        )}
      </div>

      {activeTab === "Users" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
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
                        onClick={() => { setSelectedUser(user); setIsUserFormOpen(true); }}
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-5">Procedure Name</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Base Cost</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catalog.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Briefcase className="w-4 h-4" />
                       </div>
                       <span className="font-bold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">{item.category || "General"}</span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700">
                    ${item.baseCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setSelectedCatalogItem(item); setIsCatalogFormOpen(true); }}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => { if(confirm("Delete this procedure?")) await deleteCatalogItem(item.id); }}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {catalog.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-20 text-center text-slate-400 italic">No procedures in catalog.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isUserFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedUser ? "Update User" : "Create New User"}
              </h2>
              <button
                onClick={() => setIsUserFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData) => {
                await saveUser(formData, selectedUser?.id);
                setIsUserFormOpen(false);
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
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white font-bold"
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUserFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCatalogFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                {selectedCatalogItem ? "Edit Procedure" : "New Procedure"}
              </h2>
              <button
                onClick={() => setIsCatalogFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={async (formData) => {
                await saveCatalogItem(formData, selectedCatalogItem?.id);
                setIsCatalogFormOpen(false);
              }}
              className="p-6 space-y-5"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Procedure Name</label>
                <input
                  required
                  name="name"
                  defaultValue={selectedCatalogItem?.name}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                  placeholder="e.g. Tooth Extraction"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <input
                    name="category"
                    defaultValue={selectedCatalogItem?.category || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    placeholder="e.g. Dental"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Base Cost ($)</label>
                  <input
                    required
                    name="baseCost"
                    type="number"
                    step="0.01"
                    defaultValue={selectedCatalogItem?.baseCost}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedCatalogItem?.description || ""}
                  rows={3}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Optional details about the procedure..."
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCatalogFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl shadow-md transition"
                >
                  Save Procedure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
