"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const adminLinks = [
    { title: "Dashboard", href: "/admin" },
    { title: "Employees", href: "/admin/employees" },
    { title: "Payroll", href: "/admin/payroll" },
    { title: "Leaves", href: "/admin/leaves" },
    { title: "Settings", href: "/admin/settings" },
  ];

  const employeeLinks = [
    { title: "Dashboard", href: "/employee" },
    { title: "Attendance", href: "/employee/attendance" },
    { title: "Leaves", href: "/employee/leaves" },
    { title: "Payslips", href: "/employee/payslips" },
    { title: "Profile", href: "/employee/profile" },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <Sidebar className="text-white [&_[data-sidebar=sidebar]]:bg-[#081028] [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-white/10">
      {/* Header */}
      <SidebarHeader className="px-5 py-6 border-b border-white/10 bg-[#081028]">
        <h2 className="text-2xl font-bold text-white">Employee MS</h2>
        <p className="mt-1 text-base text-slate-300">
          {isAdmin ? "Admin Panel" : "Employee Panel"}
        </p>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="bg-[#081028] px-3 py-4">
        <SidebarGroup>
          <p className="px-3 pb-3 text-sm font-bold tracking-widest text-slate-400 uppercase">
            Navigation
          </p>

          <SidebarMenu className="space-y-2">
            {links.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={`h-14 rounded-xl px-4 text-lg font-semibold ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Link href={item.href}>{item.title}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-[#081028] border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl bg-red-500 text-lg font-semibold text-white hover:bg-red-600"
        >
          Logout
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}