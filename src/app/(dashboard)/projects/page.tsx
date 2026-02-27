import { Topbar } from "@/components/layout/topbar";
import { getProjects, getProjectSpend, getProjectMemberCounts } from "@/lib/supabase/queries";
import { ProjectsList } from "./projects-list";

export default async function ProjectsPage() {
  const [projects, spendData] = await Promise.all([
    getProjects({ status: "active" }),
    getProjectSpend(),
  ]);

  const memberCounts = await getProjectMemberCounts(projects.map((p) => p.id));

  const spendMap = new Map(spendData.map((s) => [s.project_id, s]));

  const projectsWithStats = projects.map((p) => {
    const spend = spendMap.get(p.id);
    return {
      ...p,
      memberCount: memberCounts[p.id] ?? 0,
      currentSpend: spend?.total_actual ?? 0,
    };
  });

  return (
    <div>
      <Topbar title="Проекты" />
      <ProjectsList projects={projectsWithStats} />
    </div>
  );
}
