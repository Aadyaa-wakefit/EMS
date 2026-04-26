"use client";

import * as React from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from "@/app/lib/leaves-shared";
import type { BalanceCell, EmployeeRow, UserRole } from "@/app/lib/users-repo";
import { cn } from "@/lib/utils";

import { setUserRoleAction } from "../actions";
import { EmployeeBalancePanel } from "./EmployeeBalancePanel";

type PendingChange = {
  user: EmployeeRow;
  targetRole: UserRole;
};

function BalanceText({ cell }: { cell: BalanceCell }) {
  if (!cell) {
    return <span className="text-neutral-400">—</span>;
  }
  const low = cell.remaining < 2;
  return (
    <span
      className={cn(
        "tabular-nums",
        low ? "font-semibold text-rose-600" : "text-neutral-700",
      )}
    >
      {cell.remaining}
      <span className="text-neutral-400"> / {cell.allocated}</span>
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200">
        <ShieldCheck className="size-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700 ring-1 ring-neutral-200">
      Employee
    </span>
  );
}

export function EmployeesTable({
  rows,
  selfId,
}: {
  rows: EmployeeRow[];
  selfId: string;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(
    rows[0]?.id ?? null,
  );
  const [pending, setPending] = React.useState<PendingChange | null>(null);
  const [submitting, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (selectedId && !rows.some((row) => row.id === selectedId)) {
      setSelectedId(rows[0]?.id ?? null);
    }
    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0]!.id);
    }
  }, [rows, selectedId]);

  const selectedEmployee = React.useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const handleRequestRoleChange = (
    user: EmployeeRow,
    targetRole: UserRole,
  ) => {
    if (user.id === selfId) return;
    setPending({ user, targetRole });
  };

  const confirmRoleChange = () => {
    if (!pending) return;
    const formData = new FormData();
    formData.set("userId", pending.user.id);
    formData.set("role", pending.targetRole);
    startTransition(async () => {
      try {
        await setUserRoleAction(formData);
      } finally {
        setPending(null);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Card className="ring-neutral-200/80">
        <CardHeader>
          <CardTitle className="text-base">Employees</CardTitle>
          <CardDescription>
            Click a row to update the balance panel, or use the menu to change a
            teammate&apos;s role.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-400">
                <Users className="size-5" />
              </div>
              <p className="text-sm font-medium text-neutral-700">
                No employees match
              </p>
              <p className="text-xs text-neutral-500">
                Try a less strict threshold, or clear the filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-neutral-200 bg-neutral-50/60 text-left text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
                    <th className="px-4 py-2.5">Employee</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Role</th>
                    {LEAVE_TYPES.map((type) => (
                      <th
                        key={type}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
                        {LEAVE_TYPE_LABELS[type]}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {rows.map((row) => {
                    const isSelf = row.id === selfId;
                    const isAdmin = row.role === "admin";
                    const isSelected = row.id === selectedId;
                    const targetRole: UserRole = isAdmin
                      ? "employee"
                      : "admin";
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        aria-selected={isSelected}
                        className={cn(
                          "cursor-pointer align-middle transition",
                          isSelected
                            ? "bg-neutral-100/80 hover:bg-neutral-100"
                            : "hover:bg-neutral-50/60",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">
                            {row.name?.trim() || row.email}
                            {isSelf ? (
                              <span className="ml-1.5 text-[11px] font-normal text-neutral-400">
                                (you)
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {row.email}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <RoleBadge role={row.role} />
                        </td>
                        {LEAVE_TYPES.map((type) => (
                          <td
                            key={type}
                            className="px-3 py-3 whitespace-nowrap"
                          >
                            <BalanceText cell={row.balances[type]} />
                          </td>
                        ))}
                        <td
                          className="px-3 py-3 text-right whitespace-nowrap"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Open actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onSelect={() => setSelectedId(row.id)}
                                className="gap-2"
                              >
                                <Users className="size-4" />
                                View balance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={isSelf}
                                onSelect={(event) => {
                                  if (isSelf) {
                                    event.preventDefault();
                                    return;
                                  }
                                  handleRequestRoleChange(row, targetRole);
                                }}
                                className="gap-2"
                              >
                                {targetRole === "admin" ? (
                                  <UserPlus className="size-4" />
                                ) : (
                                  <UserMinus className="size-4" />
                                )}
                                {isSelf
                                  ? "Can't change own role"
                                  : targetRole === "admin"
                                    ? "Make admin"
                                    : "Revert to employee"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <EmployeeBalancePanel
          employee={selectedEmployee}
          selfId={selfId}
          onRequestRoleChange={handleRequestRoleChange}
        />
      </aside>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open && !submitting) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.targetRole === "admin"
                ? "Promote to admin?"
                : "Revert to employee?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.targetRole === "admin"
                ? `${pending.user.name?.trim() || pending.user.email} will be able to view all leave requests and approve or reject them.`
                : pending
                  ? `${pending.user.name?.trim() || pending.user.email} will lose admin access and only see their own leaves.`
                  : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmRoleChange();
              }}
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : pending?.targetRole === "admin"
                  ? "Make admin"
                  : "Revert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
