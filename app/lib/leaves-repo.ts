import { pool } from "@/app/lib/db";
import { LEAVE_TYPES } from "@/app/lib/leaves-shared";
import type { LeaveStatus, LeaveType } from "@/app/lib/leaves-shared";
import { ensureUserBalances } from "@/app/lib/users-repo";

export type { LeaveStatus, LeaveType };

export type LeaveRequestRow = {
  id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveBalanceRow = {
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
};

const REQUEST_COLUMNS = `
  lr.id,
  lr.user_id          as "userId",
  lr.employee_name    as "employeeName",
  u.email             as "employeeEmail",
  lr.leave_type       as "leaveType",
  to_char(lr.start_date, 'YYYY-MM-DD') as "startDate",
  to_char(lr.end_date, 'YYYY-MM-DD')   as "endDate",
  lr.status,
  lr.reason,
  lr.decided_by       as "decidedBy",
  lr.decided_at       as "decidedAt",
  lr.created_at       as "createdAt",
  lr.updated_at       as "updatedAt"
`;

export type ListLeavesArgs = {
  userId?: string;
  status?: LeaveStatus;
  limit?: number;
  offset?: number;
};

export async function listLeaves({
  userId,
  status,
  limit = 50,
  offset = 0,
}: ListLeavesArgs): Promise<LeaveRequestRow[]> {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (userId) {
    values.push(userId);
    filters.push(`lr.user_id = $${values.length}`);
  }
  if (status) {
    values.push(status);
    filters.push(`lr.status = $${values.length}`);
  }

  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  values.push(limit);
  const limitIdx = values.length;
  values.push(offset);
  const offsetIdx = values.length;

  const result = await pool.query<LeaveRequestRow>(
    `select ${REQUEST_COLUMNS}
     from leave_requests lr
     join "user" u on u.id = lr.user_id
     ${where}
     order by lr.created_at desc
     limit $${limitIdx} offset $${offsetIdx}`,
    values,
  );
  return result.rows;
}

export async function getLeaveById(
  id: string,
): Promise<LeaveRequestRow | null> {
  const result = await pool.query<LeaveRequestRow>(
    `select ${REQUEST_COLUMNS}
     from leave_requests lr
     join "user" u on u.id = lr.user_id
     where lr.id = $1
     limit 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getBalances(
  userId: string,
): Promise<LeaveBalanceRow[]> {
  await ensureUserBalances(userId);
  const result = await pool.query<LeaveBalanceRow>(
    `select
       leave_type as "leaveType",
       allocated,
       used,
       (allocated - used) as remaining
     from leave_balances
     where user_id = $1
     order by leave_type`,
    [userId],
  );
  return result.rows;
}

export type CreateLeaveInput = {
  userId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
};

export async function createLeave(
  input: CreateLeaveInput,
): Promise<LeaveRequestRow> {
  const result = await pool.query<LeaveRequestRow>(
    `insert into leave_requests
       (user_id, employee_name, leave_type, start_date, end_date, reason)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      input.userId,
      input.employeeName,
      input.leaveType,
      input.startDate,
      input.endDate,
      input.reason ?? null,
    ],
  );

  const created = await getLeaveById(result.rows[0]!.id);
  if (!created) {
    throw new Error("Created leave request could not be loaded");
  }
  return created;
}

function dayCount(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const diff = (end.getTime() - start.getTime()) / 86_400_000;
  return Math.max(1, Math.floor(diff) + 1);
}

export async function approveLeave(args: {
  id: string;
  adminId: string;
}): Promise<LeaveRequestRow> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const lock = await client.query<{
      id: string;
      user_id: string;
      leave_type: LeaveType;
      start_date: string;
      end_date: string;
      status: LeaveStatus;
    }>(
      `select id, user_id, leave_type,
              to_char(start_date, 'YYYY-MM-DD') as start_date,
              to_char(end_date, 'YYYY-MM-DD') as end_date,
              status
       from leave_requests
       where id = $1
       for update`,
      [args.id],
    );

    const row = lock.rows[0];
    if (!row) throw new Error("Leave request not found");
    if (row.status !== "pending") {
      throw new Error(`Cannot approve a ${row.status} request`);
    }

    const days = dayCount(row.start_date, row.end_date);

    await client.query(
      `update leave_requests
       set status = 'approved',
           decided_by = $2,
           decided_at = now(),
           updated_at = now()
       where id = $1`,
      [args.id, args.adminId],
    );

    await client.query(
      `update leave_balances
       set used = used + $3,
           updated_at = now()
       where user_id = $1 and leave_type = $2`,
      [row.user_id, row.leave_type, days],
    );

    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  const updated = await getLeaveById(args.id);
  if (!updated) throw new Error("Updated leave request could not be loaded");
  return updated;
}

export async function rejectLeave(args: {
  id: string;
  adminId: string;
}): Promise<LeaveRequestRow> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const lock = await client.query<{ status: LeaveStatus }>(
      `select status from leave_requests where id = $1 for update`,
      [args.id],
    );
    const row = lock.rows[0];
    if (!row) throw new Error("Leave request not found");
    if (row.status !== "pending") {
      throw new Error(`Cannot reject a ${row.status} request`);
    }

    await client.query(
      `update leave_requests
       set status = 'rejected',
           decided_by = $2,
           decided_at = now(),
           updated_at = now()
       where id = $1`,
      [args.id, args.adminId],
    );

    await client.query("commit");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  const updated = await getLeaveById(args.id);
  if (!updated) throw new Error("Updated leave request could not be loaded");
  return updated;
}

export type PendingSummary = {
  total: number;
  byType: Record<LeaveType, number>;
};

export async function getPendingSummary(): Promise<PendingSummary> {
  const result = await pool.query<{ leaveType: LeaveType; count: number }>(
    `select leave_type as "leaveType", count(*)::int as count
     from leave_requests
     where status = 'pending'
     group by leave_type`,
  );

  const byType = LEAVE_TYPES.reduce<Record<LeaveType, number>>(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    { sick: 0, casual: 0, vacation: 0 },
  );

  let total = 0;
  for (const row of result.rows) {
    byType[row.leaveType] = row.count;
    total += row.count;
  }

  return { total, byType };
}

export async function getRemainingBalanceFor(
  userId: string,
  leaveType: LeaveType,
): Promise<number | null> {
  const result = await pool.query<{ remaining: number }>(
    `select (allocated - used) as remaining
     from leave_balances
     where user_id = $1 and leave_type = $2
     limit 1`,
    [userId, leaveType],
  );
  return result.rows[0]?.remaining ?? null;
}

export type UserPublicProfile = {
  name: string | null;
  email: string;
};

export async function getUserPublicProfile(
  userId: string,
): Promise<UserPublicProfile | null> {
  const result = await pool.query<UserPublicProfile>(
    `select name, email from "user" where id = $1 limit 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

