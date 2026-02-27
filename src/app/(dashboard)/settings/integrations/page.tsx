import { Topbar } from "@/components/layout/topbar";
import { getAdPlatformConnections, getCurrentUser } from "@/lib/supabase/queries";
import { IntegrationsView } from "./integrations-view";

export default async function IntegrationsPage() {
  const [user, connections] = await Promise.all([
    getCurrentUser(),
    getAdPlatformConnections(),
  ]);

  return (
    <div>
      <Topbar title="Интеграции" />
      <div className="p-4 md:p-6">
        <IntegrationsView
          connections={connections}
          isAdmin={user?.role === "admin" || user?.role === "manager"}
        />
      </div>
    </div>
  );
}
