"use client";

import {
  BarChart3,
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveInventoryItem, deleteInventoryItem } from "@/app/actions/inventoryActions";

export default function ReportsClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: ({ formData, id }: { formData: FormData, id?: string }) => saveInventoryItem(formData, id),
    onSuccess: () => {
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["reportData"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportData"] });
    }
  });

  const summary = [
    { label: "Total Inventory", value: initialData.summary.totalItems, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Low Stock Items", value: initialData.summary.lowStockItems, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Inventory Value", value: `$${initialData.summary.totalValue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Patients", value: initialData.summary.totalPatients, icon: TrendingUp, color: "bg-brand-50 text-brand-700" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Clinical Reports & Inventory</h1>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Analytics Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition">
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button
            onClick={() => { setSelectedItem(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold transition shadow-lg shadow-brand-100"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summary.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Inventory Trends</h3>
            <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-brand-600"><span className="w-2 h-2 rounded-full bg-brand-600"></span> Stock Level</span>
              <span className="flex items-center gap-1.5 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Value</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={initialData.trendData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d3d3a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d3d3a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="stock" stroke="#0d3d3a" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Stock Alerts</h3>
          <div className="space-y-4">
            {initialData.inventory.filter((i: any) => i.quantity <= i.minStock).map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-[10px] text-red-600 font-black uppercase">{item.quantity} {item.unit} remaining</p>
                </div>
              </div>
            ))}
            {initialData.inventory.filter((i: any) => i.quantity <= i.minStock).length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No critical alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Current Inventory</h3>
          <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
             <button className="px-4 py-1.5 bg-white text-brand-700 text-[10px] font-black uppercase rounded-lg shadow-sm">All Items</button>
             <button className="px-4 py-1.5 text-slate-500 text-[10px] font-black uppercase rounded-lg hover:bg-white/50 transition">Consumables</button>
             <button className="px-4 py-1.5 text-slate-500 text-[10px] font-black uppercase rounded-lg hover:bg-white/50 transition">Equipment</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Item Name</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Quantity</th>
                <th className="px-8 py-5">Unit Price</th>
                <th className="px-8 py-5">Total Value</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initialData.inventory.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-lg">{item.category || 'N/A'}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${item.quantity <= item.minStock ? 'text-red-600' : 'text-slate-900'}`}>
                        {item.quantity} {item.unit}
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.quantity <= item.minStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (item.quantity / (item.minStock * 2)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-700">${item.price.toFixed(2)}</td>
                  <td className="px-8 py-5 font-black text-brand-700">${(item.quantity * item.price).toFixed(2)}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => { setSelectedItem(item); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-brand-600 transition">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900">{selectedItem ? 'Edit Item' : 'Add New Item'}</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form action={(fd) => saveMutation.mutate({ formData: fd, id: selectedItem?.id })} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Item Name</label>
                  <input name="name" defaultValue={selectedItem?.name} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                    <input name="category" defaultValue={selectedItem?.category} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Unit (e.g. pcs)</label>
                    <input name="unit" defaultValue={selectedItem?.unit} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Qty</label>
                    <input name="quantity" type="number" defaultValue={selectedItem?.quantity} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Min Stock</label>
                    <input name="minStock" type="number" defaultValue={selectedItem?.minStock || 5} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Price ($)</label>
                    <input name="price" type="number" step="0.01" defaultValue={selectedItem?.price} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancel</button>
                   <button type="submit" disabled={saveMutation.isPending} className="flex-2 px-6 py-4 bg-brand-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                     {saveMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                     Save Item
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
