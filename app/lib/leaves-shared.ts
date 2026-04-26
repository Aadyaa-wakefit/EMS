export const LEAVE_TYPES = ["sick", "casual", "vacation"] as const;
export const LEAVE_STATUSES = ["pending", "approved", "rejected"] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: "Sick",
  casual: "Casual",
  vacation: "Vacation",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function isLeaveType(value: unknown): value is LeaveType {
  return (
    typeof value === "string" &&
    (LEAVE_TYPES as readonly string[]).includes(value)
  );
}

export function isLeaveStatus(value: unknown): value is LeaveStatus {
  return (
    typeof value === "string" &&
    (LEAVE_STATUSES as readonly string[]).includes(value)
  );
}
