import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/supabase/queries";
import { NotificationsForm } from "./notifications-form";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <Topbar title="Уведомления" />
      <NotificationsForm user={user} />
    </div>
  );
}
