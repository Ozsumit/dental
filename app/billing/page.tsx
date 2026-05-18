import BillingClient from "@/components/BillingClient";
import { getPendingBillings } from "../actions/billingActions";
import { Procedure } from "@/lib/types";

export default async function BillingPage() {
  const pending = await getPendingBillings();

  return (
    <div className="h-full bg-slate-50/50">
      <BillingClient initialPending={pending as Procedure[]} />
    </div>
  );
}
