"use client";

import {
  Check,
  MousePointerClick,
  Pencil,
  ShieldCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  setLeaveAllocationAction,
  type SetAllocationState,
} from "@/app/(dashboard)/admin/actions";
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
  DEFAULT_LEAVE_ALLOCATIONS,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  type LeaveType,
} from "@/app/lib/leaves-shared";
import type { EmployeeRow, UserRole } from "@/app/lib/users-repo";
import { cn } from "@/lib/utils";

const initialState: SetAllocationState = { status: "idle" };

function getInitials(value: string | null | undefined): string {
  if (!value) return "?";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      className="h-7 gap-1 px-2.5 text-[11px]"
      disabled={pending}
    >
      <Check className="size-3.5" />
      {pending ? "Saving" : "Save"}
    </Button>
  );
}

function CancelButton({ onCancel }: { onCancel: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-neutral-500 hover:text-neutral-900"
      onClick={onCancel}
      disabled={pending}
      aria-label="Cancel"
    >
      <X className="size-3.5" />
    </Button>
  );
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
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [allocationState, allocationAction] = useActionState(
    setLeaveAllocationAction,
    initialState,
  );
  const inputBaseId = useId();

  const currentEmployeeId = employee?.id ?? null;
  const [lastEmployeeId, setLastEmployeeId] = useState<string | null>(
    currentEmployeeId,
  );
  const [lastSeenState, setLastSeenState] = useState(allocationState);

  if (currentEmployeeId !== lastEmployeeId) {
    setLastEmployeeId(currentEmployeeId);
    setEditingType(null);
  }

  if (allocationState !== lastSeenState) {
    setLastSeenState(allocationState);
    if (allocationState.status === "success") {
      setEditingType(null);
    }
  }

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
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            Leave balance
          </span>
          <span className="text-[11px] text-neutral-400">Click pencil to edit</span>
        </div>
        {LEAVE_TYPES.map((type) => {
          const cell = employee.balances[type];
          const low = cell !== null && cell.remaining < 2;
          const isEditing = editingType === type;
          const errorForThisTile =
            allocationState.status === "error" &&
            allocationState.values?.userId === employee.id &&
            allocationState.values?.leaveType === type
              ? allocationState.message
              : null;
          const inputId = `${inputBaseId}-${type}`;
          const minAllowed = cell?.used ?? 0;
          const defaultAllocated =
            cell?.allocated ?? DEFAULT_LEAVE_ALLOCATIONS[type];

          if (isEditing) {
            return (
              <form
                key={type}
                action={allocationAction}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 ring-1 ring-neutral-100"
              >
                <input type="hidden" name="userId" value={employee.id} />
                <input type="hidden" name="leaveType" value={type} />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium tracking-wider text-neutral-500 uppercase">
                    {LEAVE_TYPE_LABELS[type]}
                  </div>
                  <div className="flex items-center gap-1">
                    <CancelButton onCancel={() => setEditingType(null)} />
                    <SaveButton />
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <label
                      htmlFor={inputId}
                      className="text-[11px] text-neutral-500"
                    >
                      Allocated days
                    </label>
                    <input
                      id={inputId}
                      name="allocated"
                      type="number"
                      min={minAllowed}
                      max={365}
                      step={1}
                      defaultValue={defaultAllocated}
                      autoFocus
                      className="mt-1 w-24 rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm tabular-nums focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    />
                  </div>
                  <div className="text-right text-[11px] text-neutral-400">
                    {cell
                      ? `${cell.used} already used`
                      : "Not seeded yet"}
                  </div>
                </div>
                {errorForThisTile ? (
                  <p className="mt-2 text-[11px] text-rose-600">
                    {errorForThisTile}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-neutral-400">
                    Must be ≥ {minAllowed} (already used).
                  </p>
                )}
              </form>
            );
          }

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
              <div className="flex items-end gap-1.5 text-right leading-tight">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 self-center text-neutral-400 hover:bg-white hover:text-neutral-900"
                  onClick={() => setEditingType(type)}
                  aria-label={`Edit ${LEAVE_TYPE_LABELS[type]} allocation`}
                  title="Adjust allocation"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <div>
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
