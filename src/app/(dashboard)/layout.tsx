import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-[var(--muted)]">
      <Sidebar userName={user?.full_name ?? "Пользователь"} />

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-x-hidden transition-all duration-300 md:ml-[var(--sidebar-width,260px)]">
        {children}
      </main>
    </div>
  );
}
