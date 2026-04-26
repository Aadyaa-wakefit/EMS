"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/app/lib/auth";
import {
  setLeaveAllocation,
  setUserRole,
  type SetLeaveAllocationResult,
  type UserRole,
} from "@/app/lib/users-repo";
import { LEAVE_TYPES, type LeaveType } from "@/app/lib/leaves-shared";

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user as SessionUser;
}

async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  if (user.role !== "admin") {
    throw new Error("Only admins can perform this action");
  }
  return user;
}

function parseRole(value: FormDataEntryValue | null): UserRole | null {
  if (value === "admin" || value === "employee") return value;
  return null;
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("Missing user id");
  }

  const role = parseRole(formData.get("role"));
  if (!role) {
    throw new Error("Invalid role");
  }

  if (userId === admin.id) {
    throw new Error("You cannot change your own role");
  }

  await setUserRole({ userId, role });
  revalidatePath("/admin");
}

const ALLOCATION_MAX = 365;

function parseLeaveType(value: FormDataEntryValue | null): LeaveType | null {
  if (typeof value !== "string") return null;
  return (LEAVE_TYPES as readonly string[]).includes(value)
    ? (value as LeaveType)
    : null;
}

export type SetAllocationState = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: SetLeaveAllocationResult;
  values?: {
    userId: string;
    leaveType: LeaveType;
    allocated: number;
  };
};

export async function setLeaveAllocationAction(
  _prev: SetAllocationState,
  formData: FormData,
): Promise<SetAllocationState> {
  await requireAdmin();

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    return { status: "error", message: "Missing user id." };
  }

  const leaveType = parseLeaveType(formData.get("leaveType"));
  if (!leaveType) {
    return { status: "error", message: "Invalid leave type." };
  }

  const rawAllocated = formData.get("allocated");
  const allocated =
    typeof rawAllocated === "string" ? Number.parseInt(rawAllocated, 10) : NaN;

  if (!Number.isFinite(allocated) || !Number.isInteger(allocated)) {
    return {
      status: "error",
      message: "Enter a whole number of days.",
    };
  }

  if (allocated < 0) {
    return { status: "error", message: "Days cannot be negative." };
  }

  if (allocated > ALLOCATION_MAX) {
    return {
      status: "error",
      message: `Days cannot exceed ${ALLOCATION_MAX}.`,
    };
  }

  try {
    const result = await setLeaveAllocation({ userId, leaveType, allocated });
    revalidatePath("/admin");
    return {
      status: "success",
      result,
      values: { userId, leaveType, allocated },
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Could not update allocation.",
    };
  }
}
