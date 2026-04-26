import { pool } from "@/app/lib/db";
import type { LeaveType } from "@/app/lib/leaves-shared";

export type UserRole = "admin" | "employee";

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
