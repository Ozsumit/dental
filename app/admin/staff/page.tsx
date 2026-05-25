import { getUsers } from "@/app/actions/userActions";
import StaffClient from "@/components/admin/StaffClient";

export default async function StaffPage() {
  const users = await getUsers();

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <StaffClient initialUsers={users} />
    </div>
  );
}
