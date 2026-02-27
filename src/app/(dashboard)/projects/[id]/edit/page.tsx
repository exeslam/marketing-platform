import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { getProject } from "@/lib/supabase/queries";
import { ProjectFormPage } from "../../project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return notFound();

  return (
    <div>
      <Topbar title={`Редактировать: ${project.short_name || project.name}`} />
      <ProjectFormPage project={project} />
    </div>
  );
}
