import { getAllBillings } from "@/app/actions/billingActions";
import BillingHistoryClient from "./BillingHistoryClient";
import { Receipt } from "lucide-react";

export default async function BillingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const { data, totalPages, currentPage, totalCount } = await getAllBillings(resolvedParams);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing History</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
              Financial Records • {totalCount} Procedures
            </p>
          </div>
        </div>

        <BillingHistoryClient
          data={data}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </div>
    </main>
  );
}
