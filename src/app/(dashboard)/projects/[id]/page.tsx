import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { getProject, getProjectMembers, getBudgetRecords } from "@/lib/supabase/queries";
import { ProjectDetail } from "./project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, members, budgetRecords] = await Promise.all([
    getProject(id),
    getProjectMembers(id),
    getBudgetRecords({ projectId: id, month: "2026-02-01" }),
  ]);

  if (!project) return notFound();

  const currentSpend = budgetRecords.reduce(
    (s, r) => s + Number(r.actual_spend_kzt),
    0
  );

  return (
    <div>
      <Topbar title={project.short_name || project.name} />
      <ProjectDetail
        project={project}
        members={members}
        budgetRecords={budgetRecords}
        currentSpend={currentSpend}
      />
    </div>
  );
}
