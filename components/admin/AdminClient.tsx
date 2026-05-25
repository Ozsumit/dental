"use client";

import { useState } from "react";
import { saveUser, deleteUser, getUsers } from "@/app/actions/userActions";
import {
  saveCatalogItem,
  deleteCatalogItem,
  saveSystemSettings,
  getBillingCatalog,
  getSystemSettings,
} from "@/app/actions/billingActions";
import { deleteTaxonomy, getTaxonomies } from "@/app/actions/taxonomyActions";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Shield,
  User as UserIcon,
  Briefcase,
  Settings,
  Save,
  Loader2,
} from "lucide-react";
import { User, BillingCatalog, SystemSettings, Taxonomy } from "@prisma/client";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import TaxonomyFormModal from "./modals/TaxonomyFormModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/useUIStore";

export default function AdminClient({
  users: initialUsers,
  catalog: initialCatalog,
  settings: initialSettings,
  taxonomies: initialTaxonomies,
}: {
  users: User[];
  catalog: BillingCatalog[];
  settings: SystemSettings;
  taxonomies: Taxonomy[];
}) {
  const [activeTab, setActiveTab] = useState<
    "Users" | "Catalog" | "Taxonomies" | "Settings"
  >("Users");
  const queryClient = useQueryClient();

  const {
    isUserFormOpen,
    setUserFormOpen,
    isCatalogFormOpen,
    setCatalogFormOpen,
    isTaxonomyFormOpen,
    setTaxonomyFormOpen,
    isDeleteConfirmOpen,
    setDeleteConfirmOpen,
  } = useUIStore();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    initialData: initialUsers,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => getBillingCatalog(),
    initialData: initialCatalog,
  });

  const { data: taxonomies = [] } = useQuery({
    queryKey: ["taxonomies"],
    queryFn: () => getTaxonomies(),
    initialData: initialTaxonomies,
  });

  const { data: settings } = useQuery({
    queryKey: ["systemSettings"],
    queryFn: () => getSystemSettings(),
    initialData: initialSettings,
  });

  // Local selection states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormError, setUserFormError] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<BillingCatalog | null>(null);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<Taxonomy | null>(
    null,
  );
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "User" | "Catalog" | "Taxonomy";
  } | null>(null);

  // Helper to check current admin count
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const deleteMutation = useMutation({
    mutationFn: async (item: {
      id: string;
      type: "User" | "Catalog" | "Taxonomy";
    }) => {
      if (item.type === "User") {
        // Client guard: block deletion if it's an admin
        const userObj = users.find((u) => u.id === item.id);
        if (userObj?.role === "ADMIN") {
          throw new Error(
            "The system must retain exactly one Admin user. Deletion denied.",
          );
        }
        await deleteUser(item.id);
      } else if (item.type === "Catalog") await deleteCatalogItem(item.id);
      else if (item.type === "Taxonomy") await deleteTaxonomy(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["taxonomies"] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err: any) => {
      // Simple fallback if delete confirmation errors out
      alert(err.message || "Failed to delete item.");
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: ({ formData, id }: { formData: FormData; id?: string }) => {
      const selectedRole = formData.get("role") as string;

      // Case 1: Creating a NEW user as ADMIN when an admin already exists
      if (!id && selectedRole === "ADMIN" && adminCount >= 1) {
        throw new Error(
          "An Administrator already exists. You cannot create more than one.",
        );
      }

      // Case 2: Updating an existing user
      if (id) {
        const originalUser = users.find((u) => u.id === id);
        // Trying to demote the only admin
        if (originalUser?.role === "ADMIN" && selectedRole !== "ADMIN") {
          throw new Error(
            "The system must maintain exactly one Administrator.",
          );
        }
        // Trying to promote a regular user to admin when one already exists
        if (
          originalUser?.role !== "ADMIN" &&
          selectedRole === "ADMIN" &&
          adminCount >= 1
        ) {
          throw new Error(
            "An Administrator already exists. Cannot promote another user to Admin.",
          );
        }
      }

      return saveUser(formData, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserFormOpen(false);
    },
    onError: (err: any) =>
      setUserFormError(err.message || "Failed to save user."),
  });

  const saveCatalogMutation = useMutation({
    mutationFn: ({ formData, id }: { formData: FormData; id?: string }) =>
      saveCatalogItem(formData, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setCatalogFormOpen(false);
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (formData: FormData) => saveSystemSettings(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
    },
  });

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(itemToDelete);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Admin Control Panel
            </h1>
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
                onClick={() => setActiveTab("Taxonomies")}
                className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === "Taxonomies" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                Clinical Taxonomies
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
      </div>
      <div className="flex gap-2">
        {activeTab === "Users" && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setUserFormError("");
              setUserFormOpen(true);
            }}
            className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add New User
          </button>
        )}
        {activeTab === "Catalog" && (
          <button
            onClick={() => {
              setSelectedCatalogItem(null);
              setCatalogFormOpen(true);
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Procedure
          </button>
        )}
        {activeTab === "Taxonomies" && (
          <button
            onClick={() => {
              setSelectedTaxonomy(null);
              setTaxonomyFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> Add Taxonomy
          </button>
        )}
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
                    <span className="font-bold text-slate-900">
                      {user.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`py-1 px-3 rounded-full text-xs font-bold border ${
                        user.role === "ADMIN"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : user.role === "DOCTOR"
                            ? "bg-brand-50 text-brand-800 border-brand-200"
                            : "bg-brand-50 text-brand-700 border-brand-200"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setUserFormError("");
                          setUserFormOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Hide or disable delete button if the user has an ADMIN role */}
                      {user.role !== "ADMIN" ? (
                        <button
                          onClick={() => {
                            setItemToDelete({ id: user.id, type: "User" });
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-2 text-slate-300 cursor-not-allowed select-none"
                          title="System Administrator cannot be removed"
                        >
                          <Trash2 className="w-4 h-4 opacity-40" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ... Rest of your tabs (Catalog, Taxonomies, Settings) remain identical ... */}
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
                      <span className="font-bold text-slate-900">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {item.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700">
                    ${item.baseCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCatalogItem(item);
                          setCatalogFormOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: item.id, type: "Catalog" });
                          setDeleteConfirmOpen(true);
                        }}
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

      {activeTab === "Taxonomies" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200">
              <tr>
                <th className="px-6 py-5">Group / Category</th>
                <th className="px-6 py-5">Label</th>
                <th className="px-6 py-5">Value</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxonomies.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        {item.group}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {item.label}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {item.value}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedTaxonomy(item);
                          setTaxonomyFormOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ id: item.id, type: "Taxonomy" });
                          setDeleteConfirmOpen(true);
                        }}
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

      {activeTab === "Settings" && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              System Configuration
            </h2>
          </div>

          <form
            action={saveSettingsMutation.mutate}
            className="max-w-md space-y-6"
          >
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Default Appointment Fee ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  $
                </span>
                <input
                  required
                  name="appointmentFee"
                  type="number"
                  step="0.01"
                  defaultValue={settings?.appointmentFee}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none font-black text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="w-full bg-brand-700 text-white px-6 py-4 rounded-xl font-bold hover:bg-brand-800 transition flex items-center justify-center gap-2 shadow-lg shadow-brand-100 disabled:opacity-50"
            >
              {saveSettingsMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}{" "}
              Update Settings
            </button>
          </form>
        </div>
      )}

      {/* User Form Modal */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedUser ? "Update User" : "Create New User"}
              </h2>
              <button
                onClick={() => setUserFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={(formData) =>
                saveUserMutation.mutate({ formData, id: selectedUser?.id })
              }
              className="p-6 space-y-5"
            >
              {userFormError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{userFormError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Username
                </label>
                <input
                  required
                  name="username"
                  defaultValue={selectedUser?.username}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {selectedUser ? "New Password" : "Password"}
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
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Role
                </label>
                <select
                  name="role"
                  defaultValue={selectedUser?.role || "RECEPTIONIST"}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl outline-none bg-white font-bold"
                  // If we're updating the single admin, do not let them change their role (locks field)
                  disabled={selectedUser?.role === "ADMIN"}
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="DOCTOR">Doctor</option>
                  {/* Only show Admin as an option if we're editing the existing admin or no admins exist yet */}
                  {(selectedUser?.role === "ADMIN" || adminCount === 0) && (
                    <option value="ADMIN">Admin</option>
                  )}
                </select>
                {selectedUser?.role === "ADMIN" && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    To ensure system access, changing the Admin profile role is
                    restricted.
                  </p>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setUserFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveUserMutation.isPending}
                  className="px-6 py-3 bg-brand-700 text-white font-bold hover:bg-brand-800 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saveUserMutation.isPending ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Form Modal */}
      {isCatalogFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedCatalogItem ? "Edit Procedure" : "New Procedure"}
              </h2>
              <button
                onClick={() => setCatalogFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              action={(formData) =>
                saveCatalogMutation.mutate({
                  formData,
                  id: selectedCatalogItem?.id,
                })
              }
              className="p-6 space-y-5"
            >
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Procedure Name
                </label>
                <input
                  required
                  name="name"
                  defaultValue={selectedCatalogItem?.name}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Category
                  </label>
                  <input
                    name="category"
                    defaultValue={selectedCatalogItem?.category || ""}
                    className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Base Cost ($)
                  </label>
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
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Description
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedCatalogItem?.description || ""}
                  rows={3}
                  className="mt-1.5 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCatalogFormOpen(false)}
                  className="px-6 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveCatalogMutation.isPending}
                  className="px-6 py-3 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saveCatalogMutation.isPending
                    ? "Saving..."
                    : "Save Procedure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Taxonomy Form Modal */}
      <TaxonomyFormModal
        isOpen={isTaxonomyFormOpen}
        onClose={() => setTaxonomyFormOpen(false)}
        selectedTaxonomy={selectedTaxonomy}
        tenantId={settings?.tenantId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type}?`}
        message="Are you sure you want to remove this item? This action cannot be undone."
        confirmText="Yes, Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
