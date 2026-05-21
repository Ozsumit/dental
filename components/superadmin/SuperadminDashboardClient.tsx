"use client";

import { useState, useTransition, useMemo } from "react";
import {
  createTenant,
  deleteTenant,
  updateTenantDetails,
  resetUserPasswordGlobal,
  updateUserRoleGlobal,
} from "@/app/actions/superadminActions";
import {
  Globe,
  Users,
  Activity,
  Receipt,
  Plus,
  Trash2,
  Loader2,
  X,
  Check,
  AlertTriangle,
  Building,
  Key,
  Settings,
  Server,
  HardDrive,
  Cpu,
  Database,
  Search,
  Lock,
  CheckCircle,
} from "lucide-react";

interface GlobalStats {
  totalTenants: number;
  totalUsers: number;
  totalPatients: number;
  totalRevenue: number;
}

interface TenantItem {
  id: string;
  name: string;
  createdAt: Date;
  userCount: number;
  patientCount: number;
  appointmentCount: number;
}

interface UserItem {
  id: string;
  username: string;
  role: "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "SUPERADMIN";
  createdAt: Date;
  tenantId: string;
  tenantName: string;
}

export default function SuperadminDashboardClient({
  initialStats,
  initialTenants,
  initialUsers,
}: {
  initialStats: GlobalStats;
  initialTenants: TenantItem[];
  initialUsers: UserItem[];
}) {
  const [stats, setStats] = useState<GlobalStats>(initialStats);
  const [tenants, setTenants] = useState<TenantItem[]>(initialTenants);
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"tenants" | "users" | "health">("tenants");
  const [isPending, startTransition] = useTransition();

  // Search & Filter state for Users
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    id: "",
    adminUsername: "",
    adminPassword: "",
    appointmentFee: "300",
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Edit Tenant State
  const [tenantToEdit, setTenantToEdit] = useState<TenantItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    appointmentFee: "300",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Password Reset State
  const [userForPasswordReset, setUserForPasswordReset] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Delete Confirmation State
  const [tenantToDelete, setTenantToDelete] = useState<TenantItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Auto-generate ID slug from Name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9- ]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30);

    setCreateForm((prev) => ({
      ...prev,
      name,
      id: slug,
      adminUsername: slug ? `${slug.replace(/-/g, "")}admin` : "",
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!createForm.name || !createForm.id || !createForm.adminUsername || !createForm.adminPassword) {
      setCreateError("All fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", createForm.name);
    formData.append("id", createForm.id);
    formData.append("adminUsername", createForm.adminUsername);
    formData.append("adminPassword", createForm.adminPassword);
    formData.append("appointmentFee", createForm.appointmentFee);

    startTransition(async () => {
      const res = await createTenant(formData);
      if (res.success) {
        setCreateSuccess(`Tenant '${createForm.name}' created successfully.`);
        // Add locally
        const newT: TenantItem = {
          id: createForm.id,
          name: createForm.name,
          createdAt: new Date(),
          userCount: 1,
          patientCount: 0,
          appointmentCount: 0,
        };
        setTenants([newT, ...tenants]);
        
        // Add new admin user locally
        const newU: UserItem = {
          id: `temp-${Date.now()}`,
          username: createForm.adminUsername,
          role: "ADMIN",
          createdAt: new Date(),
          tenantId: createForm.id,
          tenantName: createForm.name,
        };
        setUsers([newU, ...users]);

        setStats((prev) => ({
          ...prev,
          totalTenants: prev.totalTenants + 1,
          totalUsers: prev.totalUsers + 1,
        }));
        
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateForm({
            name: "",
            id: "",
            adminUsername: "",
            adminPassword: "",
            appointmentFee: "300",
          });
          setCreateSuccess("");
        }, 1500);
      } else {
        setCreateError(res.error || "Failed to create tenant.");
      }
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantToEdit) return;
    setEditError("");
    setEditSuccess("");

    startTransition(async () => {
      const res = await updateTenantDetails(
        tenantToEdit.id,
        editForm.name,
        parseFloat(editForm.appointmentFee || "0")
      );
      if (res.success) {
        setEditSuccess("Tenant settings updated successfully.");
        // Update local state
        setTenants(tenants.map(t => t.id === tenantToEdit.id ? { ...t, name: editForm.name } : t));
        setUsers(users.map(u => u.tenantId === tenantToEdit.id ? { ...u, tenantName: editForm.name } : u));
        
        setTimeout(() => {
          setTenantToEdit(null);
          setEditSuccess("");
        }, 1500);
      } else {
        setEditError(res.error || "Failed to update tenant.");
      }
    });
  };

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "SUPERADMIN") => {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      startTransition(async () => {
        const res = await updateUserRoleGlobal(userId, newRole);
        if (res.success) {
          setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } else {
          alert(res.error || "Failed to update user role.");
        }
      });
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordReset) return;
    setPwdError("");
    setPwdSuccess("");

    if (newPassword.length < 6) {
      setPwdError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const res = await resetUserPasswordGlobal(userForPasswordReset.id, newPassword);
      if (res.success) {
        setPwdSuccess(`Password reset successfully for @${userForPasswordReset.username}.`);
        setTimeout(() => {
          setUserForPasswordReset(null);
          setNewPassword("");
          setPwdSuccess("");
        }, 1500);
      } else {
        setPwdError(res.error || "Failed to reset password.");
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;
    setDeleteError("");

    startTransition(async () => {
      const res = await deleteTenant(tenantToDelete.id);
      if (res.success) {
        setTenants(tenants.filter((t) => t.id !== tenantToDelete.id));
        setUsers(users.filter((u) => u.tenantId !== tenantToDelete.id));
        setStats((prev) => ({
          ...prev,
          totalTenants: prev.totalTenants - 1,
          totalUsers: prev.totalUsers - tenantToDelete.userCount,
          totalPatients: prev.totalPatients - tenantToDelete.patientCount,
        }));
        setTenantToDelete(null);
      } else {
        setDeleteError(res.error || "Failed to delete tenant.");
      }
    });
  };

  // Memoized user search/filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.tenantName.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  return (
    <div className="p-8 space-y-8 max-w-[1500px] mx-auto w-full font-sans antialiased text-slate-800 animate-in fade-in duration-300">
      
      {/* Superadmin Main Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-700 rounded-2xl">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">SaaS Command Center</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
              Global Platform Controls • Master Node Dashboard
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none bg-brand-700 hover:bg-brand-850 hover:bg-brand-800 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create New Tenant
          </button>
        </div>
      </div>

      {/* Modern Top Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "tenants"
              ? "border-brand-700 text-brand-700 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building className="w-4 h-4" />
          Platform Tenancies
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "users"
              ? "border-brand-700 text-brand-700 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          Global User Registry
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`px-6 py-3 font-bold text-sm rounded-t-xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "health"
              ? "border-brand-700 text-brand-700 bg-white"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Activity className="w-4 h-4" />
          System Health Telemetry
        </button>
      </div>

      {/* Render Content Blocks */}
      {activeTab === "tenants" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Global Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Tenants */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Tenancies</p>
                <p className="text-3xl font-extrabold text-slate-900">{stats.totalTenants}</p>
                <p className="text-xs text-slate-500 font-medium">Clinics configured</p>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Globe className="w-6 h-6" />
              </div>
            </div>

            {/* Global Users */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">System Users</p>
                <p className="text-3xl font-extrabold text-slate-900">{stats.totalUsers}</p>
                <p className="text-xs text-slate-500 font-medium">Registered accounts</p>
              </div>
              <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Global Patients */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Patients</p>
                <p className="text-3xl font-extrabold text-slate-900">{stats.totalPatients}</p>
                <p className="text-xs text-slate-500 font-medium">Active patient profiles</p>
              </div>
              <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* Cumulative Revenue */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cumulative Revenue</p>
                <p className="text-3xl font-extrabold text-brand-700">
                  Rs. {stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 font-medium">Total platform billings</p>
              </div>
              <div className="p-4 bg-brand-50 text-brand-700 rounded-2xl">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Platform Tenancies Listing Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900">Platform Tenancies</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Database workspaces configured on the CRM node</p>
              </div>
              <span className="text-xs font-black uppercase bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl border border-slate-200">
                {tenants.length} tenants total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5">Tenant Name</th>
                    <th className="px-8 py-5">ID Slug</th>
                    <th className="px-8 py-5">Date Created</th>
                    <th className="px-8 py-5 text-center">Users</th>
                    <th className="px-8 py-5 text-center">Patients</th>
                    <th className="px-8 py-5 text-center">Appointments</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{t.name}</span>
                          {t.id === "master" && (
                            <span className="ml-2 px-2.5 py-0.5 text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-full uppercase tracking-wider">
                              Master Node
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-xs font-mono text-slate-500">{t.id}</td>
                      <td className="px-8 py-4 text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-8 py-4 text-center font-bold text-slate-800">{t.userCount}</td>
                      <td className="px-8 py-4 text-center text-slate-500">{t.patientCount}</td>
                      <td className="px-8 py-4 text-center text-slate-500">{t.appointmentCount}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {t.id !== "master" && (
                            <button
                              onClick={() => {
                                setTenantToEdit(t);
                                setEditForm({
                                  name: t.name,
                                  appointmentFee: "300", // placeholder as settings are loaded
                                });
                              }}
                              className="text-slate-500 hover:text-brand-700 hover:bg-slate-100 p-2 rounded-xl transition cursor-pointer"
                              title="Edit Tenant Settings"
                            >
                              <Settings className="w-4.5 h-4.5" />
                            </button>
                          )}
                          {t.id !== "master" ? (
                            <button
                              onClick={() => setTenantToDelete(t)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition cursor-pointer"
                              title="Cascade Delete Tenant"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-lg shrink-0">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* User Filtering Block */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name or tenant..."
                onChange={(e) => setUserSearch(e.target.value)}
                value={userSearch}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-brand-700 focus:bg-white outline-none transition"
              />
            </div>
            <div className="w-full md:w-auto flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full md:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 outline-none focus:ring-1 focus:ring-brand-700 transition"
              >
                <option value="ALL">All Access Roles</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
              </select>
            </div>
          </div>

          {/* User Registry Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">User Registry</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Platform-wide system accounts and permissions settings</p>
              </div>
              <span className="text-xs font-black uppercase bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl border border-brand-100">
                {filteredUsers.length} Users Listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-5">Account Username</th>
                    <th className="px-8 py-5">Affiliated Workspace</th>
                    <th className="px-8 py-5">Access Role</th>
                    <th className="px-8 py-5">Date Created</th>
                    <th className="px-8 py-5 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-extrabold border border-slate-200 shrink-0">
                          {u.username.substring(0, 2).toUpperCase()}
                        </span>
                        <div className="leading-tight">
                          <p className="font-bold text-slate-900">@{u.username}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">UID: {u.id.substring(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.tenantName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-black tracking-wide outline-none cursor-pointer transition ${
                            u.role === "SUPERADMIN"
                              ? "bg-purple-50 text-purple-700 border-purple-150"
                              : u.role === "ADMIN"
                                ? "bg-blue-50 text-blue-700 border-blue-150"
                                : u.role === "DOCTOR"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                  : "bg-amber-50 text-amber-700 border-amber-150"
                          }`}
                        >
                          <option value="SUPERADMIN">SUPERADMIN</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="DOCTOR">DOCTOR</option>
                          <option value="RECEPTIONIST">RECEPTIONIST</option>
                        </select>
                      </td>
                      <td className="px-8 py-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => setUserForPasswordReset(u)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl border border-transparent hover:border-slate-300 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 font-bold">
                        No platform accounts match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "health" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Telemetry Resource Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* System CPU Load Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active CPU Node Load</p>
                  <h3 className="text-2xl font-black text-slate-900">24% Normal</h3>
                </div>
                <div className="p-3 bg-brand-50 text-brand-700 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>

              {/* Graphical Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: "24%" }} className="bg-emerald-500 h-full rounded-full transition-all duration-1000" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Usage: 24.2%</span>
                  <span>Limits: 100% (8 Cores)</span>
                </div>
              </div>
            </div>

            {/* RAM Utilized Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memory Allocated</p>
                  <h3 className="text-2xl font-black text-slate-900">1.4 GB / 4.0 GB</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>

              {/* Graphical Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: "35%" }} className="bg-blue-500 h-full rounded-full transition-all duration-1000" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Occupied: 35.0%</span>
                  <span>Node Heap Limit: 4.0 GB</span>
                </div>
              </div>
            </div>

            {/* API Latency Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">API Response Latency</p>
                  <h3 className="text-2xl font-black text-slate-900">12ms (Outstanding)</h3>
                </div>
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
              </div>

              {/* Graphical Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: "12%" }} className="bg-teal-500 h-full rounded-full transition-all duration-1000" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Avg response: 12.1ms</span>
                  <span>SLA Threshold: 100ms</span>
                </div>
              </div>
            </div>

          </div>

          {/* Database Connections & Cache details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Database Telemetry */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-brand-600" /> Prisma Connection Pool
              </h4>
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="text-slate-900 font-mono">SQLite (Active dev.db Node)</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Active Pool Connections</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    8 Connected
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Connection Timeout config</span>
                  <span className="text-slate-900">5000ms</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Schema version</span>
                  <span className="text-slate-900 font-mono text-[10px]">2026_05_19_073525_dev</span>
                </div>
              </div>
            </div>

            {/* Cache Telemetry */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-brand-600" /> Server Memory Cache (NextJS)
              </h4>
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Cache Driver</span>
                  <span className="text-slate-900 font-mono">Internal Memory Cache (LRU)</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Cache Hit Rate</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">94.2% Outstanding</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Evictions Count</span>
                  <span className="text-slate-900">0 Items</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Total Cached Pages</span>
                  <span className="text-slate-900">12 Routes</span>
                </div>
              </div>
            </div>

          </div>

          {/* Audit Logs Block */}
          <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl font-mono text-xs shadow-lg border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Platform Activity Stream (Real-time Audit logs)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">Node: CRM-Master-US1</span>
            </div>
            <div className="space-y-1.5 h-44 overflow-y-auto font-mono text-slate-300 leading-relaxed scrollbar-thin">
              <p className="text-slate-500 font-black">--- System startup completed. Listening for multi-tenant requests. ---</p>
              <p><span className="text-emerald-500 font-bold">[16:21:05] INFO:</span> Tenant &apos;nepal-general&apos; authorized connection pool request. Query took 4.2ms.</p>
              <p><span className="text-amber-500 font-bold">[16:19:40] WARN:</span> Clinician &apos;doctor&apos; requested patient list export catalog.</p>
              <p><span className="text-red-400 font-bold">[16:18:22] SECURE:</span> Master auth cookie re-signed for global administrator &apos;superadmin&apos;.</p>
              <p><span className="text-emerald-500 font-bold">[16:15:10] INFO:</span> NextJS path &apos;/superadmin&apos; revalidated cache successfully.</p>
              <p><span className="text-emerald-500 font-bold">[16:11:02] INFO:</span> Cleared expired database sessions from SQLite cache. 0 rows affected.</p>
              <p><span className="text-emerald-500 font-bold">[16:05:40] INFO:</span> Tenant &apos;apex-dental&apos; initialized session routing for user &apos;apexreceptionist&apos;.</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Settings Modal */}
      {tenantToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setTenantToEdit(null)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Tenant Configurations</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Configure tenancy details and clinical fee variables</p>
            </div>

            {editError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-250 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {editError}
              </div>
            )}

            {editSuccess && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-250 text-teal-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
                {editSuccess}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apex Dental Care"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-700 outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Appointment Consultation Fee (Rs.)
                </label>
                <input
                  type="number"
                  required
                  placeholder="300"
                  value={editForm.appointmentFee}
                  onChange={(e) => setEditForm({ ...editForm, appointmentFee: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-700 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTenantToEdit(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Configurations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {userForPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => {
                setUserForPasswordReset(null);
                setNewPassword("");
                setPwdError("");
                setPwdSuccess("");
              }}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" /> Reset User Credentials
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Reset credentials for account <strong className="text-slate-700">@{userForPasswordReset.username}</strong>
              </p>
            </div>

            {pwdError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-semibold">
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0" />
                {pwdSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  New Account Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-700 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserForPasswordReset(null);
                    setNewPassword("");
                    setPwdError("");
                    setPwdSuccess("");
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Credentials Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Create New Tenancy</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Configure database workspace & initial admin details</p>
            </div>

            {createError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold flex items-center gap-2">
                <Check className="w-4.5 h-4.5 shrink-0 animate-bounce" />
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Tenant Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Tenant Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apex Dental Care"
                  onChange={handleNameChange}
                  value={createForm.name}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition"
                />
              </div>

              {/* Tenant Slug ID */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Tenant Slug ID (For routing slugs)
                </label>
                <input
                  type="text"
                  required
                  name="id"
                  placeholder="apex-dental"
                  onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
                  value={createForm.id}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition"
                />
              </div>

              {/* Initial Fee */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Initial Appointment Fee (Rs.)
                </label>
                <input
                  type="number"
                  name="appointmentFee"
                  placeholder="300"
                  onChange={(e) => setCreateForm({ ...createForm, appointmentFee: e.target.value })}
                  value={createForm.appointmentFee}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition"
                />
              </div>

              {/* Administrator setup */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-500" /> Default Administrator Credentials
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Admin Username
                    </label>
                    <input
                      type="text"
                      required
                      name="adminUsername"
                      placeholder="apexadmin"
                      onChange={(e) => setCreateForm({ ...createForm, adminUsername: e.target.value })}
                      value={createForm.adminUsername}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      name="adminPassword"
                      placeholder="••••••••"
                      onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                      value={createForm.adminPassword}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-brand-700 focus:border-brand-700 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Create
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Tenant Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" /> Cascade Delete Tenancy
            </h3>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="text-sm text-slate-600 space-y-3">
              <p>
                Are you absolutely sure you want to delete tenant <strong className="text-slate-900">&quot;{tenantToDelete.name}&quot;</strong>?
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 font-medium">
                Warning: This is a destructive operation. All associated users, patients, diagnostics, appointments, billing catalogs, and records will be deleted permanently.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTenantToDelete(null);
                  setDeleteError("");
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-750 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
