// app/(dashboard)/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar */}
        <AppSidebar />

        {/* Right Content Area */}
        <main className="flex-1 overflow-hidden">
          {/* Top Bar */}
          <div className="flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-slate-800">
              Employee Management System
            </h1>
          </div>

          {/* Page Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}