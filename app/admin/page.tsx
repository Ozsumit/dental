import { getUsers } from "@/app/actions/userActions";
import { getBillingCatalog } from "@/app/actions/billingActions";
import AdminClient from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const [users, catalog] = await Promise.all([
    getUsers(),
    getBillingCatalog()
  ]);

  return (
    <div className="max-w-[1200px] mx-auto">
      <AdminClient users={users} catalog={catalog} />
    </div>
  );
}
