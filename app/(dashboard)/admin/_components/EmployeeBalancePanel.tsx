"use client";

import { MousePointerClick, ShieldCheck, UserMinus, UserPlus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
} from "@/app/lib/leaves-shared";
import type { EmployeeRow, UserRole } from "@/app/lib/users-repo";
import { cn } from "@/lib/utils";

function getInitials(value: string | null | undefined): string {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function EmployeeBalancePanel({
  employee,
  selfId,
  onRequestRoleChange,
}: {
  employee: EmployeeRow | null;
  selfId: string;
  onRequestRoleChange: (employee: EmployeeRow, target: UserRole) => void;
}) {
  if (!employee) {
    return (
      <Card className="ring-neutral-200/80">
        <CardHeader>
          <CardTitle className="text-base">Leave balance</CardTitle>
          <CardDescription>
            Pick an employee from the list to inspect their balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50/40 px-3 py-8 text-center">
            <div className="grid size-9 place-items-center rounded-full bg-neutral-100 text-neutral-400">
              <MousePointerClick className="size-4" />
            </div>
            <p className="text-xs text-neutral-500">
              No employee selected yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = getInitials(employee.name ?? employee.email);
  const isSelf = employee.id === selfId;
  const isAdmin = employee.role === "admin";
  const targetRole: UserRole = isAdmin ? "employee" : "admin";

  return (
    <Card className="ring-neutral-200/80">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-neutral-900 text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <CardTitle className="truncate text-base">
              {employee.name?.trim() || employee.email}
            </CardTitle>
            <CardDescription className="truncate">
              {employee.email}
            </CardDescription>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
              isAdmin
                ? "bg-violet-50 text-violet-700 ring-violet-200"
                : "bg-neutral-50 text-neutral-700 ring-neutral-200",
            )}
          >
            {isAdmin ? <ShieldCheck className="size-3" /> : null}
            {isAdmin ? "Admin" : "Employee"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="px-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
          Leave balance
        </div>
        {LEAVE_TYPES.map((type) => {
          const cell = employee.balances[type];
          const low = cell !== null && cell.remaining < 2;
          return (
            <div
              key={type}
              className="flex items-end justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2.5"
            >
              <div>
                <div className="text-xs font-medium tracking-wider text-neutral-500 uppercase">
                  {LEAVE_TYPE_LABELS[type]}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {cell
                    ? `${cell.used} used of ${cell.allocated}`
                    : "Not configured"}
                </div>
              </div>
              <div className="text-right leading-tight">
                <div
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    low ? "text-rose-600" : "text-neutral-900",
                  )}
                >
                  {cell ? cell.remaining : "—"}
                </div>
                <div className="text-[11px] text-neutral-400">left</div>
              </div>
            </div>
          );
        })}

        <div className="mt-1 border-t border-neutral-200 pt-3">
          {isSelf ? (
            <p className="text-xs text-neutral-500">
              You can&apos;t change your own role.
            </p>
          ) : (
            <Button
              type="button"
              variant={targetRole === "admin" ? "default" : "outline"}
              className="w-full gap-1.5"
              onClick={() => onRequestRoleChange(employee, targetRole)}
            >
              {targetRole === "admin" ? (
                <UserPlus className="size-4" />
              ) : (
                <UserMinus className="size-4" />
              )}
              {targetRole === "admin" ? "Make admin" : "Revert to employee"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
