import { pool } from "@/app/lib/db";
import {
  DEFAULT_LEAVE_ALLOCATIONS,
  LEAVE_TYPES,
  type LeaveType,
} from "@/app/lib/leaves-shared";

export type UserRole = "admin" | "employee";

export async function ensureUserBalances(userId: string): Promise<void> {
  await pool.query(
    `insert into leave_balances (user_id, leave_type, allocated, used)
     values
       ($1, 'sick', $2, 0),
       ($1, 'casual', $3, 0),
       ($1, 'vacation', $4, 0)
     on conflict (user_id, leave_type) do nothing`,
    [
      userId,
      DEFAULT_LEAVE_ALLOCATIONS.sick,
      DEFAULT_LEAVE_ALLOCATIONS.casual,
      DEFAULT_LEAVE_ALLOCATIONS.vacation,
    ],
  );
}

export async function ensureAllUserBalances(): Promise<void> {
  await pool.query(
    `insert into leave_balances (user_id, leave_type, allocated, used)
     select u.id, t.leave_type, t.allocated, 0
     from "user" u
     cross join (values
       ('sick'::text,    $1::int),
       ('casual'::text,  $2::int),
       ('vacation'::text,$3::int)
     ) as t(leave_type, allocated)
     on conflict (user_id, leave_type) do nothing`,
    [
      DEFAULT_LEAVE_ALLOCATIONS.sick,
      DEFAULT_LEAVE_ALLOCATIONS.casual,
      DEFAULT_LEAVE_ALLOCATIONS.vacation,
    ],
  );
}

export type BalanceCell = {
  allocated: number;
  used: number;
  remaining: number;
} | null;

export type EmployeeRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  balances: {
    sick: BalanceCell;
    casual: BalanceCell;
    vacation: BalanceCell;
  };
  minRemaining: number | null;
};

type RawRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  sick_alloc: number | null;
  sick_used: number | null;
  casual_alloc: number | null;
  casual_used: number | null;
  vacation_alloc: number | null;
  vacation_used: number | null;
};

function toCell(
  allocated: number | null,
  used: number | null,
): BalanceCell {
  if (allocated === null || used === null) return null;
  return {
    allocated,
    used,
    remaining: allocated - used,
  };
}

function normalizeRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "employee";
}

function shapeRow(raw: RawRow): EmployeeRow {
  const sick = toCell(raw.sick_alloc, raw.sick_used);
  const casual = toCell(raw.casual_alloc, raw.casual_used);
  const vacation = toCell(raw.vacation_alloc, raw.vacation_used);
  const remainings = [sick, casual, vacation]
    .map((cell) => (cell ? cell.remaining : null))
    .filter((value): value is number => value !== null);
  const minRemaining = remainings.length === 0 ? null : Math.min(...remainings);
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: normalizeRole(raw.role),
    balances: { sick, casual, vacation },
    minRemaining,
  };
}

export type ListEmployeesArgs = {
  type?: LeaveType;
  lt?: number;
  limit?: number;
};

export async function listEmployeesWithBalances({
  type,
  lt,
  limit = 200,
}: ListEmployeesArgs = {}): Promise<EmployeeRow[]> {
  await ensureAllUserBalances();

  const values: unknown[] = [];
  const filters: string[] = [];

  if (type && typeof lt === "number" && Number.isFinite(lt)) {
    const aliasMap: Record<LeaveType, string> = {
      sick: "sb",
      casual: "cb",
      vacation: "vb",
    };
    const alias = aliasMap[type];
    values.push(lt);
    filters.push(
      `(${alias}.allocated is not null and (${alias}.allocated - ${alias}.used) < $${values.length})`,
    );
  }

  const where = filters.length ? `where ${filters.join(" and ")}` : "";
  values.push(limit);
  const limitIdx = values.length;

  const sql = `
    select
      u.id,
      u.name,
      u.email,
      coalesce(u.role, 'employee') as role,
      sb.allocated as sick_alloc,    sb.used as sick_used,
      cb.allocated as casual_alloc,  cb.used as casual_used,
      vb.allocated as vacation_alloc, vb.used as vacation_used
    from "user" u
    left join leave_balances sb on sb.user_id = u.id and sb.leave_type = 'sick'
    left join leave_balances cb on cb.user_id = u.id and cb.leave_type = 'casual'
    left join leave_balances vb on vb.user_id = u.id and vb.leave_type = 'vacation'
    ${where}
    order by u.name nulls last, u.email
    limit $${limitIdx}
  `;

  const result = await pool.query<RawRow>(sql, values);
  return result.rows.map(shapeRow);
}

export async function getEmployeeWithBalances(
  userId: string,
): Promise<EmployeeRow | null> {
  const result = await pool.query<RawRow>(
    `select
       u.id,
       u.name,
       u.email,
       coalesce(u.role, 'employee') as role,
       sb.allocated as sick_alloc,    sb.used as sick_used,
       cb.allocated as casual_alloc,  cb.used as casual_used,
       vb.allocated as vacation_alloc, vb.used as vacation_used
     from "user" u
     left join leave_balances sb on sb.user_id = u.id and sb.leave_type = 'sick'
     left join leave_balances cb on cb.user_id = u.id and cb.leave_type = 'casual'
     left join leave_balances vb on vb.user_id = u.id and vb.leave_type = 'vacation'
     where u.id = $1
     limit 1`,
    [userId],
  );
  const row = result.rows[0];
  return row ? shapeRow(row) : null;
}

export async function setUserRole(args: {
  userId: string;
  role: UserRole;
}): Promise<void> {
  await pool.query(
    `update "user"
     set role = $1, "updatedAt" = now()
     where id = $2`,
    [args.role, args.userId],
  );
}

export type SetLeaveAllocationArgs = {
  userId: string;
  leaveType: LeaveType;
  allocated: number;
};

export type SetLeaveAllocationResult = {
  allocated: number;
  used: number;
  remaining: number;
};

export async function setLeaveAllocation({
  userId,
  leaveType,
  allocated,
}: SetLeaveAllocationArgs): Promise<SetLeaveAllocationResult> {
  if (!Number.isInteger(allocated) || allocated < 0) {
    throw new Error("Allocation must be a non-negative integer");
  }
  if (!LEAVE_TYPES.includes(leaveType)) {
    throw new Error(`Unknown leave type: ${leaveType}`);
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const lock = await client.query<{ used: number }>(
      `select used from leave_balances
       where user_id = $1 and leave_type = $2
       for update`,
      [userId, leaveType],
    );

    const used = lock.rows[0]?.used ?? 0;
    if (allocated < used) {
      throw new Error(
        `Allocation (${allocated}) cannot be lower than days already used (${used}).`,
      );
    }

    const upsert = await client.query<{
      allocated: number;
      used: number;
    }>(
      `insert into leave_balances (user_id, leave_type, allocated, used, updated_at)
       values ($1, $2, $3, 0, now())
       on conflict (user_id, leave_type)
       do update set allocated = excluded.allocated, updated_at = now()
       returning allocated, used`,
      [userId, leaveType, allocated],
    );

    await client.query("commit");

    const row = upsert.rows[0]!;
    return {
      allocated: row.allocated,
      used: row.used,
      remaining: row.allocated - row.used,
    };
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
