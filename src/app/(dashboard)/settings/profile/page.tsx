import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser } from "@/lib/supabase/queries";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <Topbar title="Профиль" />
      <ProfileForm user={user} />
    </div>
  );
}
