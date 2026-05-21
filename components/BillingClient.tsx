"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getPendingBillings,
  finalizeBilling,
  markAsPaid,
  markPatientProceduresPaid,
} from "@/app/actions/billingActions";
import { Procedure, Patient } from "@/lib/types";
import {
  Receipt,
  CheckCircle2,
  Briefcase,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Phone,
  Printer,
  FileText,
  Building,
  CreditCard,
  MapPin,
  Mail,
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function BillingClient({
  initialPending,
}: {
  initialPending: Procedure[];
}) {
  const [pending, setPending] = useState<Procedure[]>(initialPending);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PATIENTS_PER_PAGE = 10;

  // Loading States
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [processingPatients, setProcessingPatients] = useState<string[]>([]);

  // Modals & Notifications
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  });

  // Itemized Invoice State
  const [invoiceGroup, setInvoiceGroup] = useState<{
    patient: Patient;
    items: Procedure[];
    total: number;
    invoiceNo: number;
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchPendingSilently = useCallback(async () => {
    try {
      const data = await getPendingBillings();
      setPending(data as Procedure[]);
    } catch (err) {
      console.error("Failed to sync billings", err);
    }
  }, []);

  // --- ACTIONS ---
  const handleFinalize = async (id: string, cost: number) => {
    setProcessingItems((prev) => [...prev, id]);
    try {
      setPending((prev) =>
        prev.map((item) => (item.id === id ? { ...item, cost } : item)),
      );
      await finalizeBilling(id, cost);
      showToast("Procedure cost updated", "success");
      fetchPendingSilently();
    } catch {
      showToast("Failed to update cost", "error");
      fetchPendingSilently();
    } finally {
      setProcessingItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const executePaid = async (id: string) => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
    setProcessingItems((prev) => [...prev, id]);
    try {
      setPending((prev) => prev.filter((item) => item.id !== id));
      await markAsPaid(id);
      showToast("Payment recorded successfully", "success");
      fetchPendingSilently();

      // Auto-update invoice if open
      if (invoiceGroup) {
        const remainingItems = invoiceGroup.items.filter((i) => i.id !== id);
        if (remainingItems.length === 0) setInvoiceGroup(null);
        else
          setInvoiceGroup({
            ...invoiceGroup,
            items: remainingItems,
            total: remainingItems.reduce((s, i) => s + i.cost, 0),
          });
      }
    } catch {
      showToast("Failed to process payment", "error");
      fetchPendingSilently();
    } finally {
      setProcessingItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const executeAllPaid = async (patientId: string, total: number) => {
    setInvoiceGroup(null); // Close invoice modal
    setProcessingPatients((prev) => [...prev, patientId]);
    try {
      setPending((prev) => prev.filter((item) => item.patientId !== patientId));
      await markPatientProceduresPaid(patientId);
      showToast(`Settled ${formatCurrency(total)} balance`, "success");
      fetchPendingSilently();
    } catch {
      showToast("Failed to settle balance", "error");
      fetchPendingSilently();
    } finally {
      setProcessingPatients((prev) => prev.filter((id) => id !== patientId));
    }
  };

  // --- TRIGGERS ---
  const triggerPaidConfirm = (id: string, amount: number) => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Single Payment",
      message: `Collect ${formatCurrency(amount)} for this procedure? This will mark it as paid.`,
      onConfirm: () => executePaid(id),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // --- DATA PROCESSING ---
  const grouped = useMemo(() => {
    const map: Record<
      string,
      { patient: Patient; items: Procedure[]; total: number }
    > = {};
    const filtered = pending.filter((item) => {
      const p = item.patient;
      if (!p) return false;
      const search = searchTerm.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(search) ||
        p.lastName.toLowerCase().includes(search) ||
        p.phone.includes(searchTerm)
      );
    });

    filtered.forEach((item) => {
      if (!item.patientId || !item.patient) return;
      if (!map[item.patientId]) {
        map[item.patientId] = { patient: item.patient, items: [], total: 0 };
      }
      map[item.patientId].items.push(item);
      map[item.patientId].total += item.cost;
    });

    return Object.values(map).sort((a, b) => b.total - a.total); // Sort highest balances first
  }, [pending, searchTerm]);

  const totalPages = Math.ceil(grouped.length / PATIENTS_PER_PAGE);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [grouped.length, currentPage, totalPages]);

  const paginatedGrouped = grouped.slice(
    (currentPage - 1) * PATIENTS_PER_PAGE,
    currentPage * PATIENTS_PER_PAGE,
  );
  const totalOutstanding = useMemo(
    () => grouped.reduce((sum, g) => sum + g.total, 0),
    [grouped],
  );

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto pb-24 relative hide-on-print">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-300 font-semibold text-sm text-slate-800">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-brand-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          {toast.message}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Confirm Payment"
        cancelText="Cancel"
      />

      {/* HEADER & GLOBAL METRICS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 rounded-xl">
              <Receipt className="w-7 h-7 text-brand-600" />
            </div>
            Accounts Receivable
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-lg text-sm">
            Manage outstanding balances, review itemized procedure costs, and
            finalize patient billing securely.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-900/10 rounded-xl text-sm font-semibold text-slate-800 outline-none transition-all shadow-sm focus:bg-white"
            />
          </div>
          <div className="bg-brand-50/50 text-brand-900 px-6 py-3 rounded-xl border border-brand-100 flex items-center gap-4 w-full sm:w-auto justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-0.5">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BILLING LIST (TABLE FORMAT) */}
      <div className="space-y-6">
        {grouped.length === 0 ? (
          <div className="py-24 bg-white rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center shadow-sm">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Accounts Clear</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              {searchTerm
                ? "No records match your search criteria."
                : "All patient accounts are fully settled."}
            </p>
          </div>
        ) : (
          paginatedGrouped.map((group) => {
            const isProcessing = processingPatients.includes(group.patient.id);

            return (
              <div
                key={group.patient.id}
                className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
              >
                {/* Patient Header Section */}
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner border border-brand-200/50">
                      {group.patient.firstName[0]}
                      {group.patient.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {group.patient.firstName} {group.patient.lastName}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />{" "}
                          {group.patient.phone}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md">
                          {group.items.length} Pending Items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Balance Due
                      </p>
                      <p className="text-xl font-bold text-slate-900 tracking-tight">
                        {formatCurrency(group.total)}
                      </p>
                    </div>
                    <button
                      onClick={() => setInvoiceGroup({ ...group, invoiceNo: Math.floor(100000 + Math.random() * 900000) })}
                      className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm shadow-brand-900/20 hover:bg-brand-700 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                    >
                      <FileText className="w-4 h-4" /> Itemized Bill
                    </button>
                  </div>
                </div>

                {/* Patient Procedures Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Procedure / Treatment
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-56">
                          Cost Adjustment
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right w-32">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {group.items.map((item) => {
                        const isItemProcessing = processingItems.includes(
                          item.id,
                        );
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50 transition-colors ${isItemProcessing ? "opacity-50" : ""}`}
                          >
                            <td className="px-6 py-4 font-medium text-slate-500">
                              {new Date(item.procedureDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-slate-800">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative group/input w-36">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  defaultValue={item.cost}
                                  disabled={isItemProcessing}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      e.currentTarget.blur();
                                  }}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val !== item.cost && !isNaN(val))
                                      handleFinalize(item.id, val);
                                  }}
                                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-900/20 transition-all disabled:opacity-50"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() =>
                                  triggerPaidConfirm(item.id, item.cost)
                                }
                                disabled={isItemProcessing}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-200 hover:bg-brand-50 text-slate-700 hover:text-brand-700 hover:border-brand-200 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                              >
                                {isItemProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    Pay <ChevronRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Page <span className="text-slate-900 font-bold">{currentPage}</span>{" "}
            of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* INVOICE / ITEMIZED BILL MODAL             */}
      {/* ========================================= */}
      {invoiceGroup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:absolute print:inset-0 print:p-0 print:bg-white print:block animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:rounded-none print:shadow-none print:w-full animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Actions Header (Hidden on print) */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 print:hidden shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" /> Invoice
                Preview
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={() => setInvoiceGroup(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <span className="font-bold text-xl leading-none">
                    &times;
                  </span>
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible print:p-8 flex-1 bg-white">
              {/* Clinic Header */}
              <div className="flex justify-between items-start border-b-2 border-brand-800/10 pb-8 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-sm print:border print:border-black print:text-black print:bg-white">
                    <Building className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Dental Clinic Pro
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> 123 Health Ave, Medical
                      District
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5" /> +1 (555) 123-4567
                      <span className="mx-1">•</span>
                      <Mail className="w-3.5 h-3.5" /> info@dentalpro.com
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-slate-200 uppercase tracking-widest print:text-slate-400">
                    Invoice
                  </h2>
                  <p className="text-sm font-bold text-slate-800 mt-2">
                    INV-{invoiceGroup.invoiceNo}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-10 p-5 bg-slate-50 rounded-2xl border border-slate-100 print:border-none print:p-0 print:bg-transparent">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
                  Billed To
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {invoiceGroup.patient.firstName}{" "}
                  {invoiceGroup.patient.lastName}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                    {invoiceGroup.patient.phone}
                  </p>
                  {invoiceGroup.patient.email && (
                    <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {invoiceGroup.patient.email}
                    </p>
                  )}
                  {invoiceGroup.patient.address && (
                    <p className="text-sm text-slate-600 font-medium flex items-start gap-2 mt-2 w-full max-w-sm">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {invoiceGroup.patient.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden mb-8 print:border-none">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-black">
                      <th className="py-4 px-5 font-bold text-xs text-slate-500 uppercase tracking-wider w-1/4">
                        Date
                      </th>
                      <th className="py-4 px-5 font-bold text-xs text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="py-4 px-5 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-300">
                    {invoiceGroup.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 px-5 text-sm font-medium text-slate-500">
                          {new Date(item.procedureDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 text-sm font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-4 px-5 text-sm font-bold text-slate-900 text-right">
                          {formatCurrency(item.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-1/2 lg:w-2/5 space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 print:p-0 print:border-none print:bg-transparent">
                  <div className="flex justify-between text-sm font-semibold text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoiceGroup.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-500 pb-3 border-b border-slate-200 print:border-black">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-brand-700 pt-1 print:text-black">
                    <span>Total Due</span>
                    <span>{formatCurrency(invoiceGroup.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-16 pt-8 border-t border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Thank you for choosing us
                </p>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Payment is expected within 30 days of the invoice date.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions (Hidden on print) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row justify-end items-center gap-3 print:hidden shrink-0">
              <button
                onClick={() => setInvoiceGroup(null)}
                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() =>
                  executeAllPaid(invoiceGroup.patient.id, invoiceGroup.total)
                }
                disabled={processingPatients.includes(invoiceGroup.patient.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md shadow-brand-900/20 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
              >
                {processingPatients.includes(invoiceGroup.patient.id) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" /> Collect{" "}
                    {formatCurrency(invoiceGroup.total)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PRINT STYLES */}
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
