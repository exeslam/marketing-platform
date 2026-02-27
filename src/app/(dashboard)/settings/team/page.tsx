import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentUser, getAllProfiles, getAllProjectMemberships, getProjects } from "@/lib/supabase/queries";
import { TeamList } from "./team-list";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profiles, memberships, projects] = await Promise.all([
    getAllProfiles(),
    getAllProjectMemberships(),
    getProjects(),
  ]);

  return (
    <div>
      <Topbar title="Команда" />
      <TeamList
        profiles={profiles}
        currentUser={user}
        memberships={memberships}
        projects={projects}
      />
    </div>
  );
}
