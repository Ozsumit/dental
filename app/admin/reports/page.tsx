import { getReportData } from "@/app/actions/reportActions";
import ReportsClient from "@/components/admin/ReportsClient";

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <ReportsClient initialData={data} />
    </div>
  );
}
