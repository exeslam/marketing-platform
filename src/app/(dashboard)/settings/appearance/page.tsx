import { Topbar } from "@/components/layout/topbar";
import { AppearanceForm } from "./appearance-form";

export default function AppearancePage() {
  return (
    <div>
      <Topbar title="Внешний вид" />
      <AppearanceForm />
    </div>
  );
}
