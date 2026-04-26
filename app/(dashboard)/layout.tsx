import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-neutral-50">
        <AppSidebar />

        <main className="flex-1 overflow-hidden">
          <div className="flex h-12 items-center gap-2 border-b border-neutral-200 bg-white px-3">
            <SidebarTrigger className="text-neutral-500 hover:text-neutral-900" />
            <span className="text-sm font-medium text-neutral-700">LMS</span>
          </div>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
