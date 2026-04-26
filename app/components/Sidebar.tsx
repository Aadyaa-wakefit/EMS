"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/app/lib/auth-client";

type NavLink = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const ADMIN_LINKS: NavLink[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Leaves", href: "/admin/leaves", icon: CalendarDays },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const EMPLOYEE_LINKS: NavLink[] = [
  { title: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { title: "Leaves", href: "/employee/leaves", icon: CalendarDays },
];

function getInitials(value: string | null | undefined): string {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAdmin = pathname.startsWith("/admin");
  const links = isAdmin ? ADMIN_LINKS : EMPLOYEE_LINKS;

  const user = session?.user;
  const displayName = user?.name?.trim() || user?.email || "Signed out";
  const displayEmail = user?.email ?? "";
  const initials = getInitials(user?.name ?? user?.email);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <Sidebar className="border-r border-neutral-200">
      <SidebarHeader className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="grid size-7 place-items-center rounded-md bg-neutral-900 text-[13px] font-semibold text-white">
            L
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-neutral-900">LMS</div>
            <div className="text-[11px] text-neutral-500">
              {isAdmin ? "Admin" : "Employee"}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {links.map(({ title, href, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className="h-9 rounded-md px-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 data-[active=true]:bg-neutral-100 data-[active=true]:font-medium data-[active=true]:text-neutral-900"
                  >
                    <Link href={href}>
                      <Icon className="size-4" aria-hidden />
                      <span>{title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!user}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-neutral-900 text-[11px] font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-neutral-900">
                {displayName}
              </div>
              {displayEmail ? (
                <div className="truncate text-[11px] text-neutral-500">
                  {displayEmail}
                </div>
              ) : null}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
              Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} className="gap-2">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
