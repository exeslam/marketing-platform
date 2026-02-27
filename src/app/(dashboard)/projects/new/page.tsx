import { Topbar } from "@/components/layout/topbar";
import { ProjectFormPage } from "../project-form";

export default function NewProjectPage() {
  return (
    <div>
      <Topbar title="Новый проект" />
      <ProjectFormPage />
    </div>
  );
}
