import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarRange, Plus, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/app/lib/auth";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  type LeaveStatus,
  isLeaveStatus,
} from "@/app/lib/leaves-shared";
import {
  getBalances,
  getPendingSummary,
  listLeaves,
  type LeaveBalanceRow,
  type PendingSummary,
} from "@/app/lib/leaves-repo";

import { LeaveDecisionForm } from "@/app/(dashboard)/leaves/_components/LeaveDecisionForm";
import {
  StatusBadge,
  formatDate,
  formatRange,
  cn,
} from "./_components/shared";

const STATUS_FILTERS: { value: "all" | LeaveStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

type SearchParams = Promise<{ status?: string }>;

export const metadata = {
  title: "Leaves – LMS",
};

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  const isAdmin = user.role === "admin";

  const params = await searchParams;
  const statusParam = params?.status;
  const explicitStatus: LeaveStatus | undefined = isLeaveStatus(statusParam)
    ? statusParam
    : undefined;

  const adminDefaultedToPending =
    isAdmin && !explicitStatus && statusParam !== "all";
  const effectiveStatus: LeaveStatus | undefined = adminDefaultedToPending
    ? "pending"
    : explicitStatus;

  const [requests, balances, pendingSummary] = (await Promise.all([
    listLeaves({
      userId: isAdmin ? undefined : user.id,
      status: effectiveStatus,
      limit: 100,
    }),
    isAdmin ? Promise.resolve(null) : getBalances(user.id),
    isAdmin ? getPendingSummary() : Promise.resolve(null),
  ])) as [
    Awaited<ReturnType<typeof listLeaves>>,
    LeaveBalanceRow[] | null,
    PendingSummary | null,
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Leaves
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isAdmin
              ? "Review every leave request and approve or reject as needed."
              : "Track your leave history and submit a new request."}
          </p>
        </div>
        {!isAdmin ? (
          <Button asChild size="lg" className="gap-1.5">
            <Link href="/leaves/new">
              <Plus className="size-4" />
              New leave request
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_FILTERS.map((filter) => {
          const isActive =
            filter.value === "all"
              ? !effectiveStatus
              : filter.value === effectiveStatus;
          const href =
            filter.value === "all"
              ? "/leaves?status=all"
              : `/leaves?status=${filter.value}`;
          return (
            <Link
              key={filter.value}
              href={href}
              scroll={false}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                isActive
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="ring-neutral-200/80">
          <CardHeader>
            <CardTitle className="text-base">
              {isAdmin ? "All requests" : "Your requests"}
            </CardTitle>
            <CardDescription>
              {requests.length === 0
                ? "Nothing to show yet."
                : `${requests.length} request${requests.length === 1 ? "" : "s"} matching this view.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <div className="grid size-10 place-items-center rounded-full bg-neutral-100 text-neutral-400">
                  <CalendarRange className="size-5" />
                </div>
                <p className="text-sm font-medium text-neutral-700">
                  No leave requests
                </p>
                <p className="text-xs text-neutral-500">
                  {isAdmin
                    ? "Once your team submits leave, it will show up here."
                    : "Submit your first request to see it appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-neutral-200 bg-neutral-50/60 text-left text-[11px] font-medium tracking-wider text-neutral-500 uppercase">
                      <th className="px-4 py-2.5">Employee</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Dates</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Submitted</th>
                      <th className="px-4 py-2.5 text-right">
                        {isAdmin ? "Actions" : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {requests.map((req) => (
                      <tr
                        key={req.id}
                        className="transition hover:bg-neutral-50/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/leaves/${req.id}`}
                            className="font-medium text-neutral-900 hover:underline"
                          >
                            {req.employeeName}
                          </Link>
                          {req.employeeEmail ? (
                            <div className="text-xs text-neutral-500">
                              {req.employeeEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {LEAVE_TYPE_LABELS[req.leaveType]}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {formatRange(req.startDate, req.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isAdmin && req.status === "pending" ? (
                            <LeaveDecisionForm id={req.id} variant="inline" />
                          ) : (
                            <Link
                              href={`/leaves/${req.id}`}
                              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
                            >
                              Open
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          {isAdmin ? (
            <Card className="ring-neutral-200/80">
              <CardHeader>
                <CardTitle className="text-base">Pending approvals</CardTitle>
                <CardDescription>
                  Requests waiting on your decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-end justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2.5">
                  <div>
                    <div className="text-xs font-medium tracking-wider text-neutral-500 uppercase">
                      Total pending
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Across the team
                    </div>
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-2xl font-semibold text-neutral-900">
                      {pendingSummary?.total ?? 0}
                    </div>
                    <div className="text-[11px] text-neutral-400">requests</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="px-1 text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                    By type
                  </div>
                  {LEAVE_TYPES.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-neutral-700"
                    >
                      <span>{LEAVE_TYPE_LABELS[type]}</span>
                      <span className="font-medium text-neutral-900 tabular-nums">
                        {pendingSummary?.byType[type] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>

                {pendingSummary && pendingSummary.total === 0 ? (
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-500">
                    <Inbox className="size-3.5" />
                    Inbox zero. Nothing to review.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="ring-neutral-200/80">
                <CardHeader>
                  <CardTitle className="text-base">
                    Your leave balance
                  </CardTitle>
                  <CardDescription>
                    Allocated days remaining for this year.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {!balances || balances.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      No balance configured yet.
                    </p>
                  ) : (
                    balances.map((balance) => (
                      <div
                        key={balance.leaveType}
                        className="flex items-end justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2.5"
                      >
                        <div>
                          <div className="text-xs font-medium tracking-wider text-neutral-500 uppercase">
                            {LEAVE_TYPE_LABELS[balance.leaveType]}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {balance.used} used of {balance.allocated}
                          </div>
                        </div>
                        <div className="text-right leading-tight">
                          <div className="text-2xl font-semibold text-neutral-900">
                            {balance.remaining}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            left
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <p className="mt-3 px-1 text-[11px] text-neutral-400">
                Need more days?{" "}
                <span className="font-medium text-neutral-500">
                  Reach out to your admin.
                </span>
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
