"use client";

import { useState } from "react";
import { saveUser, deleteUser } from "@/app/actions/userActions";
import { saveCatalogItem, deleteCatalogItem, saveSystemSettings } from "@/app/actions/billingActions";
import { Plus, Edit2, Trash2, X, Shield, User as UserIcon, Receipt, Briefcase, Settings, Save } from "lucide-react";
import { User, BillingCatalog, SystemSettings } from "@prisma/client";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminClient({ users, catalog, settings }: { users: User[], catalog: BillingCatalog[], settings: SystemSettings }) {
  const [activeTab, setActiveTab] = useState<"Users" | "Catalog" | "Settings">("Users");

  // User states
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Catalog states
  const [isCatalogFormOpen, setIsCatalogFormOpen] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<BillingCatalog | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Control Panel</h1>
            <div className="flex gap-4 mt-2">
               <button
                 onClick={() => setActiveTab("Users")}
                 className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Users" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
               >
                  User Management
               </button>
               <button
                 onClick={() => setActiveTab("Catalog")}
                 className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Catalog" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
               >
                  Billing Catalog
               </button>
               <button
                 onClick={() => setActiveTab("Settings")}
                 className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Settings" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
               >
                  Settings
               </button>
            </div>
          </div>
        </div>

        {activeTab === "Users" ? (
          <button
            onClick={() => { setSelectedUser(null); setIsUserFormOpen(true); }}
            className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add New User
          </button>
        ) : activeTab === "Catalog" ? (
          <button
            onClick={() => { setSelectedCatalogItem(null); setIsCatalogFormOpen(true); }}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Procedure
          </button>
        ) : null}
      </div>

      {activeTab === "Users" && (
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
                      user.role === "DOCTOR" ? "bg-brand-50 text-brand-800 border-brand-200" :
                      "bg-brand-50 text-brand-700 border-brand-200"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setSelectedUser(user); setIsUserFormOpen(true); }}
                        className="p-2 text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(user); setIsDeleteModalOpen(true); }}
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
      )}

      {activeTab === "Catalog" && (
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
                       <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
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
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedCatalogItem(item); setIsDeleteModalOpen(true); }}
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

      {activeTab === "Settings" && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">System Configuration</h2>
          </div>

          <form action={saveSystemSettings} className="max-w-md space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Default Appointment Fee ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  required
                  name="appointmentFee"
                  type="number"
                  step="0.01"
                  defaultValue={settings.appointmentFee}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none font-black text-slate-700"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">This fee will be automatically pre-filled when creating new appointments.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-700 text-white px-6 py-4 rounded-xl font-bold hover:bg-brand-800 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-100"
            >
              <Save className="w-5 h-5" /> Update Settings
            </button>
          </form>
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
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
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
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
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
                  className="px-6 py-3 bg-brand-700 text-white font-bold hover:bg-brand-800 rounded-xl shadow-md transition"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (activeTab === "Users" && selectedUser) {
            await deleteUser(selectedUser.id);
          } else if (activeTab === "Catalog" && selectedCatalogItem) {
            await deleteCatalogItem(selectedCatalogItem.id);
          }
        }}
        title={`Delete ${activeTab === "Users" ? "User" : "Procedure"}?`}
        message={`Are you sure you want to remove this ${activeTab === "Users" ? "user account" : "catalog item"}? This action cannot be undone.`}
        confirmText="Yes, Delete"
        variant="danger"
      />

      {isCatalogFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-500" />
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
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                  placeholder="e.g. Tooth Extraction"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <input
                    name="category"
                    defaultValue={selectedCatalogItem?.category || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
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
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-black text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedCatalogItem?.description || ""}
                  rows={3}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
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
                  className="px-6 py-3 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl shadow-md transition"
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
