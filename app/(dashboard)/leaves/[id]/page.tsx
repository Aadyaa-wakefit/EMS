import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/app/lib/auth";
import { LEAVE_TYPE_LABELS } from "@/app/lib/leaves-shared";
import {
  getLeaveById,
  getRemainingBalanceFor,
  getUserPublicProfile,
} from "@/app/lib/leaves-repo";

import { LeaveDecisionForm } from "../_components/LeaveDecisionForm";
import {
  StatusBadge,
  dayCountInclusive,
  formatDate,
  formatRange,
} from "../_components/shared";

type RouteParams = Promise<{ id: string }>;

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTimestamp(value: Date | null): string {
  if (!value) return "—";
  return TIMESTAMP_FORMATTER.format(value);
}

export const metadata = {
  title: "Leave request – LMS",
};

export default async function LeaveDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  const user = session.user as {
    id: string;
    role?: string | null;
  };
  const isAdmin = user.role === "admin";

  const leave = await getLeaveById(id);
  if (!leave) notFound();
  if (!isAdmin && leave.userId !== user.id) notFound();

  const days = dayCountInclusive(leave.startDate, leave.endDate);

  const [requesterProfile, requesterRemaining, deciderProfile] =
    isAdmin
      ? await Promise.all([
          getUserPublicProfile(leave.userId),
          getRemainingBalanceFor(leave.userId, leave.leaveType),
          leave.decidedBy
            ? getUserPublicProfile(leave.decidedBy)
            : Promise.resolve(null),
        ])
      : [null, null, null];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/leaves"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft className="size-3.5" />
          Back to leaves
        </Link>
      </div>

      <Card className="ring-neutral-200/80">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg text-neutral-900">
                {leave.employeeName}
              </CardTitle>
              <CardDescription>
                {LEAVE_TYPE_LABELS[leave.leaveType]} leave ·{" "}
                {formatRange(leave.startDate, leave.endDate)} · {days} day
                {days === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <StatusBadge status={leave.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <DetailGrid
            rows={[
              { label: "Employee", value: leave.employeeName },
              { label: "Email", value: leave.employeeEmail ?? "—" },
              {
                label: "Leave type",
                value: LEAVE_TYPE_LABELS[leave.leaveType],
              },
              { label: "Start date", value: formatDate(leave.startDate) },
              { label: "End date", value: formatDate(leave.endDate) },
              {
                label: "Total days",
                value: `${days} day${days === 1 ? "" : "s"}`,
              },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
              Reason
            </span>
            <p className="rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-sm text-neutral-700">
              {leave.reason?.trim() || "No reason provided."}
            </p>
          </div>

          <Separator />

          <DetailGrid
            rows={[
              {
                label: "Submitted",
                value: formatTimestamp(leave.createdAt),
              },
              {
                label: "Last update",
                value: formatTimestamp(leave.updatedAt),
              },
              {
                label: "Decision",
                value:
                  leave.status === "pending"
                    ? "Pending review"
                    : `${leave.status === "approved" ? "Approved" : "Rejected"} ${
                        leave.decidedAt
                          ? `on ${formatTimestamp(leave.decidedAt)}`
                          : ""
                      }`,
              },
            ]}
          />

          {isAdmin && leave.status === "pending" ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="mb-2 text-xs font-medium tracking-wider text-neutral-500 uppercase">
                Admin actions
              </div>
              <LeaveDecisionForm id={leave.id} variant="block" />
            </div>
          ) : null}

          {!isAdmin && leave.status === "pending" ? (
            <p className="text-xs text-neutral-500">
              Your request is awaiting review. You will see the result here
              once an admin decides.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="ring-neutral-200/80">
            <CardHeader>
              <CardTitle className="text-base">Employee profile</CardTitle>
              <CardDescription>
                Context on the requester for this leave.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DetailGrid
                rows={[
                  {
                    label: "Name",
                    value:
                      requesterProfile?.name?.trim() ||
                      leave.employeeName ||
                      "—",
                  },
                  {
                    label: "Email",
                    value:
                      requesterProfile?.email ?? leave.employeeEmail ?? "—",
                  },
                  {
                    label: `${LEAVE_TYPE_LABELS[leave.leaveType]} remaining`,
                    value:
                      requesterRemaining === null
                        ? "Not configured"
                        : `${requesterRemaining} day${requesterRemaining === 1 ? "" : "s"}`,
                  },
                  {
                    label: "Requested",
                    value: `${days} day${days === 1 ? "" : "s"}`,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="ring-neutral-200/80">
            <CardHeader>
              <CardTitle className="text-base">Decision history</CardTitle>
              <CardDescription>
                Audit trail for this request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leave.status === "pending" ? (
                <p className="text-sm text-neutral-600">Awaiting review.</p>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-neutral-700">
                  <div>
                    <span className="font-medium text-neutral-900">
                      {leave.status === "approved" ? "Approved" : "Rejected"}
                    </span>
                    {deciderProfile ? (
                      <>
                        {" by "}
                        <span className="font-medium text-neutral-900">
                          {deciderProfile.name?.trim() || deciderProfile.email}
                        </span>
                      </>
                    ) : null}
                    {leave.decidedAt ? (
                      <>
                        {" on "}
                        <span className="text-neutral-600">
                          {formatTimestamp(leave.decidedAt)}
                        </span>
                      </>
                    ) : null}
                    .
                  </div>
                  {deciderProfile?.email ? (
                    <div className="text-xs text-neutral-500">
                      {deciderProfile.email}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function DetailGrid({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            {row.label}
          </span>
          <span className="text-sm text-neutral-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
