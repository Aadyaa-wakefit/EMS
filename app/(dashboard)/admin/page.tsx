import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { X } from "lucide-react";

import { auth } from "@/app/lib/auth";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  type LeaveType,
  isLeaveType,
} from "@/app/lib/leaves-shared";
import { listEmployeesWithBalances } from "@/app/lib/users-repo";

import { cn } from "@/lib/utils";
import { EmployeesTable } from "@/app/(dashboard)/admin/_components/EmployeesTable";

const THRESHOLDS = [1, 2, 3, 4] as const;

type SearchParams = Promise<{ type?: string; lt?: string }>;

export const metadata = {
  title: "Team – LMS",
};

function buildHref(params: { type?: LeaveType; lt?: number }): string {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.lt !== undefined) search.set("lt", String(params.lt));
  const qs = search.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  const me = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  if (me.role !== "admin") {
    redirect("/leaves");
  }

  const params = await searchParams;
  const typeParam = params?.type;
  const ltParam = params?.lt;

  const selectedType: LeaveType | undefined = isLeaveType(typeParam)
    ? typeParam
    : undefined;

  let selectedLt: number | undefined;
  if (selectedType && typeof ltParam === "string") {
    const parsed = Number.parseInt(ltParam, 10);
    if (Number.isFinite(parsed) && THRESHOLDS.includes(parsed as 1 | 2 | 3 | 4)) {
      selectedLt = parsed;
    }
  }

  const rows = await listEmployeesWithBalances({
    type: selectedType,
    lt: selectedLt,
    limit: 200,
  });

  const total = rows.length;
  const filterActive = Boolean(selectedType && selectedLt !== undefined);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Team
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {filterActive
              ? `${total} ${total === 1 ? "employee matches" : "employees match"} this filter.`
              : `${total} ${total === 1 ? "employee" : "employees"} on the team.`}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-200 bg-neutral-50/70 px-2.5 py-2">
        <FilterGroup
          label="Type"
          chips={[
            {
              key: "all",
              label: "All",
              href: "/admin",
              active: !selectedType,
            },
            ...LEAVE_TYPES.map((type) => ({
              key: type,
              label: LEAVE_TYPE_LABELS[type],
              href: buildHref({ type }),
              active: selectedType === type,
            })),
          ]}
        />

        <span
          aria-hidden
          className="hidden h-5 w-px bg-neutral-200 sm:inline-block"
        />

        <FilterGroup
          label="Remaining"
          disabled={!selectedType}
          disabledHint="Pick a leave type first."
          chips={[
            {
              key: "any",
              label: "Any",
              href: selectedType ? buildHref({ type: selectedType }) : "#",
              active: !!selectedType && !selectedLt,
            },
            ...THRESHOLDS.map((n) => ({
              key: `lt-${n}`,
              label: `< ${n}`,
              href: selectedType ? buildHref({ type: selectedType, lt: n }) : "#",
              active: selectedLt === n,
            })),
          ]}
        />

        {selectedType ? (
          <Link
            href="/admin"
            scroll={false}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-white hover:text-neutral-900"
          >
            <X className="size-3" />
            Clear
          </Link>
        ) : null}
      </div>

      <EmployeesTable rows={rows} selfId={me.id} />
    </div>
  );
}

type Chip = {
  key: string;
  label: string;
  href: string;
  active: boolean;
};

function FilterGroup({
  label,
  chips,
  disabled = false,
  disabledHint,
}: {
  label: string;
  chips: Chip[];
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        disabled && "opacity-60",
      )}
    >
      <span className="px-1 text-[10px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
        {label}
      </span>
      {chips.map((chip) => {
        const baseClass = cn(
          "inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium transition",
        );
        const activeClass =
          chip.active && !disabled
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900";
        if (disabled) {
          return (
            <span
              key={chip.key}
              aria-disabled
              title={disabledHint}
              className={cn(
                baseClass,
                "cursor-not-allowed border-dashed border-neutral-200 bg-white/50 text-neutral-400",
              )}
            >
              {chip.label}
            </span>
          );
        }
        return (
          <Link
            key={chip.key}
            href={chip.href}
            scroll={false}
            className={cn(baseClass, activeClass)}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
