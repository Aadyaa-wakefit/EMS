"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  type LeaveType,
} from "@/app/lib/leaves-shared";

import {
  createLeaveRequest,
  type CreateLeaveActionState,
} from "../actions";

const INITIAL_STATE: CreateLeaveActionState = {};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayCount(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const diff = (endDate.getTime() - startDate.getTime()) / 86_400_000;
  return Math.max(1, Math.floor(diff) + 1);
}

export function NewLeaveForm({ employeeName }: { employeeName: string }) {
  const [state, formAction] = useActionState(
    createLeaveRequest,
    INITIAL_STATE,
  );

  const fieldId = useId();
  const today = useMemo(() => todayIso(), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const days = dayCount(startDate, endDate);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-employee`}
          className="text-xs font-medium text-neutral-600"
        >
          Employee
        </label>
        <Input
          id={`${fieldId}-employee`}
          value={employeeName}
          readOnly
          aria-readonly
          className="bg-neutral-50 text-neutral-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-type`}
          className="text-xs font-medium text-neutral-600"
        >
          Leave type
        </label>
        <Select name="leaveType" required>
          <SelectTrigger id={`${fieldId}-type`} className="w-full">
            <SelectValue placeholder="Select a leave type" />
          </SelectTrigger>
          <SelectContent position="popper" align="start" sideOffset={4}>
            {(LEAVE_TYPES as readonly LeaveType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {LEAVE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-start`}
            className="text-xs font-medium text-neutral-600"
          >
            Start date
          </label>
          <Input
            id={`${fieldId}-start`}
            type="date"
            name="startDate"
            value={startDate}
            min={today}
            onChange={(e) => {
              const next = e.target.value;
              setStartDate(next);
              if (endDate < next) setEndDate(next);
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${fieldId}-end`}
            className="text-xs font-medium text-neutral-600"
          >
            End date
          </label>
          <Input
            id={`${fieldId}-end`}
            type="date"
            name="endDate"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-reason`}
          className="text-xs font-medium text-neutral-600"
        >
          Reason{" "}
          <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea
          id={`${fieldId}-reason`}
          name="reason"
          rows={3}
          maxLength={500}
          placeholder="Add context for your manager…"
          className={cn(
            "min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-xs text-neutral-500">
        <span>Total days requested</span>
        <span className="font-medium text-neutral-900">
          {days} day{days === 1 ? "" : "s"}
        </span>
      </div>

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="lg" asChild>
          <Link href="/leaves">Cancel</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Submitting…" : "Submit request"}
    </Button>
  );
}
