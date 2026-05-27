"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPendingBillings,
  finalizeBilling,
  markPatientProceduresPaid,
} from "@/app/actions/billingActions";
import BillingTable from "@/components/billing/BillingTable";
import EditProcedureModal from "@/components/billing/editBillModal";
import BillingStatsCards from "@/components/billing/billingStatsCard";
import InvoiceModal from "@/components/billing/invoiceModal";
import { Procedure, Patient } from "@/lib/types";
import {
  X,
  Printer,
  Building,
  MapPin,
  Phone,
  CreditCard,
  Loader2,
  FileText,
  Pencil,
  Banknote,
  Hourglass,
  CheckCircle2,
  Undo2,
  FileSignature,
  Search,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface BillingStats {
  totalRevenue: number;
  revenueMonth: string;
  paidToday: number;
  paidTransactions: number;
  refundsIssued: number;
  refundCases: number;
}

// ==========================================
// SUB-COMPONENT: BILLING TOOLBAR
// ==========================================
interface BillingToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: "ALL" | "PENDING" | "PAID";
  setStatusFilter: (filter: "ALL" | "PENDING" | "PAID") => void;
}

function BillingToolbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: BillingToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <button className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#152a45] active:scale-[0.98] transition-all shadow-sm">
          <FileSignature className="w-4 h-4" /> Generate Consent PDF
        </button>
        <button className="flex items-center gap-2 bg-white text-[#1E5B94] border border-[#D0E2F5] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#F0F6FF] active:scale-[0.98] transition-all shadow-sm">
          <FileText className="w-4 h-4" /> Sahamati Patra
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === "ALL"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === "PENDING"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-500 hover:text-amber-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === "PAID"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-emerald-700"
            }`}
          >
            Paid
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-blue-50 rounded-xl text-xs text-slate-800 outline-none shadow-sm transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CORE LAYOUT MODULE: BILLING CLIENT
// ==========================================
export default function BillingClient({
  initialPending,
  initialStats,
}: {
  initialPending: Procedure[];
  initialStats?: BillingStats;
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PAID">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [stats, setStats] = useState<BillingStats>(
    initialStats || {
      totalRevenue: 124500,
      revenueMonth: new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      paidToday: 22400,
      paidTransactions: 18,
      refundsIssued: 0,
      refundCases: 0,
    },
  );

  const { data: pending = [] } = useQuery({
    queryKey: ["pendingBillings", ""],
    queryFn: () => getPendingBillings() as Promise<Procedure[]>,
    initialData: initialPending,
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [invoiceGroup, setInvoiceGroup] = useState<{
    patient: Patient;
    items: Procedure[];
    total: number;
    invoiceNo: number;
  } | null>(null);

  const [editProcedure, setEditProcedure] = useState<Procedure | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // --- MUTATIONS ---
  const finalizeMutation = useMutation({
    mutationFn: ({ id, cost }: { id: string; cost: number }) =>
      finalizeBilling(id, cost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingBillings"] });
      showToast("Procedure cost updated successfully", "success");
      setEditProcedure(null);
    },
    onError: () => showToast("Failed to update cost", "error"),
  });

  const settleAllMutation = useMutation({
    mutationFn: (patientId: string) => markPatientProceduresPaid(patientId),
    onSuccess: (_, patientId) => {
      const patientItems = pending.filter(
        (p) => p.patientId === patientId && p.status !== "PAID",
      );
      const totalSettled = patientItems.reduce(
        (sum, item) => sum + item.cost,
        0,
      );

      if (totalSettled > 0) {
        setStats((prev) => ({
          ...prev,
          totalRevenue: prev.totalRevenue + totalSettled,
          paidToday: prev.paidToday + totalSettled,
          paidTransactions: prev.paidTransactions + patientItems.length,
        }));
      }

      queryClient.invalidateQueries({ queryKey: ["pendingBillings"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });

      showToast(
        `Settled NPR ${formatCurrency(totalSettled)} balance`,
        "success",
      );
      setInvoiceGroup(null);
    },
    onError: () => showToast("Failed to settle balance", "error"),
  });

  // --- CALCULATION HOOKS ---
  const pendingTotal = useMemo(() => {
    return pending
      .filter((item) => item.status !== "PAID")
      .reduce((sum, item) => sum + (item.cost || 0), 0);
  }, [pending]);

  const pendingInvoicesCount = useMemo(() => {
    const uniquePatients = new Set(
      pending
        .filter((p) => p.patientId && p.status !== "PAID")
        .map((p) => p.patientId),
    );
    return uniquePatients.size;
  }, [pending]);

  const filteredItems = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return pending
      .filter((item) => {
        const p = item.patient;
        if (!p) return false;

        if (statusFilter === "PENDING" && item.status === "PAID") return false;
        if (statusFilter === "PAID" && item.status !== "PAID") return false;

        return (
          p.firstName.toLowerCase().includes(search) ||
          p.lastName.toLowerCase().includes(search) ||
          p.phone.includes(searchTerm)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.procedureDate).getTime() -
          new Date(a.procedureDate).getTime(),
      );
  }, [pending, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredItems, currentPage]);

  const viewTotals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const charge = item.cost;
        const isPaid = item.status === "PAID";
        const payment = isPaid ? charge : 0;
        const balance = charge - payment;
        return {
          charge: acc.charge + charge,
          payment: acc.payment + payment,
          balance: acc.balance + balance,
        };
      },
      { charge: 0, payment: 0, balance: 0 },
    );
  }, [filteredItems]);

  const handleOpenInvoice = (patientId: string, status: string) => {
    const patientItems = pending.filter(
      (p) => p.patientId === patientId && p.status === status,
    );
    if (patientItems.length > 0 && patientItems[0].patient) {
      const total = patientItems.reduce((sum, item) => sum + item.cost, 0);
      setInvoiceGroup({
        patient: patientItems[0].patient,
        items: patientItems,
        total,
        invoiceNo: Math.floor(100000 + Math.random() * 900000),
      });
    }
  };

  const handleSaveProcedureEdit = async (id: string, cost: number) => {
    await finalizeMutation.mutateAsync({ id, cost });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 relative hide-on-print">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[170] flex items-center gap-3 px-5 py-4 bg-white border border-slate-200/80 rounded-2xl shadow-xl text-sm text-slate-800">
          <span className="font-semibold tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-[30px] font-black text-slate-900 tracking-tight leading-none">
            Billing & Ledger
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Track operational earnings, edit treatment charges, and manage
            system receipts.
          </p>
        </div>

        <BillingStatsCards
          stats={stats}
          pendingTotal={pendingTotal}
          pendingInvoicesCount={pendingInvoicesCount}
          formatCurrency={formatCurrency}
        />

        <BillingToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <BillingTable
          paginatedItems={paginatedItems}
          filteredItems={filteredItems}
          viewTotals={viewTotals}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          onOpenInvoice={handleOpenInvoice}
          onOpenEdit={setEditProcedure}
          formatCurrency={formatCurrency}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      <InvoiceModal
        invoiceGroup={invoiceGroup}
        onClose={() => setInvoiceGroup(null)}
        onSettleBalance={(patientId) => settleAllMutation.mutate(patientId)}
        isSettling={settleAllMutation.isPending}
        formatCurrency={formatCurrency}
      />

      <EditProcedureModal
        isOpen={!!editProcedure}
        procedure={editProcedure}
        onClose={() => setEditProcedure(null)}
        onSave={handleSaveProcedureEdit}
        isSaving={finalizeMutation.isPending}
      />

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .hide-on-print > div:not(.fixed) {
            display: none;
          }
          .fixed,
          .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            width: 100vw;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
