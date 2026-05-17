import { getUsers } from "@/app/actions/userActions";
import AdminClient from "@/components/admin/AdminClient";

export default async function AdminPage() {
  const users = await getUsers();

  return (
    <div className="max-w-[1200px] mx-auto">
      <AdminClient users={users} />
    </div>
  );
}
