import { cn } from "@/lib/utils";
import {
  LEAVE_STATUS_LABELS,
  type LeaveStatus,
} from "@/app/lib/leaves-shared";

export { cn };

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_NO_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(`${value}T00:00:00`);
}

export function formatDate(value: string | Date): string {
  return DATE_FORMATTER.format(toDate(value));
}

export function formatRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatRangeCompact(start: string, end: string): string {
  if (start === end) return formatDate(start);
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${DATE_NO_YEAR_FORMATTER.format(startDate)} – ${formatDate(endDate)}`;
  }
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export function dayCountInclusive(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const diff = (endDate.getTime() - startDate.getTime()) / 86_400_000;
  return Math.max(1, Math.floor(diff) + 1);
}

const STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        STATUS_STYLES[status],
      )}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}
