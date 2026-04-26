"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/app/lib/auth";
import { isLeaveType } from "@/app/lib/leaves-shared";
import {
  approveLeave,
  createLeave,
  rejectLeave,
} from "@/app/lib/leaves-repo";

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

async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  return user;
}

async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Only admins can perform this action");
  }
  return user;
}

export type CreateLeaveActionState = {
  error?: string;
};

export async function createLeaveRequest(
  _prev: CreateLeaveActionState,
  formData: FormData,
): Promise<CreateLeaveActionState> {
  const user = await requireUser();

  const leaveType = formData.get("leaveType");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const reasonRaw = formData.get("reason");

  if (!isLeaveType(leaveType)) {
    return { error: "Select a valid leave type" };
  }
  if (typeof startDate !== "string" || !startDate) {
    return { error: "Start date is required" };
  }
  if (typeof endDate !== "string" || !endDate) {
    return { error: "End date is required" };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after start date" };
  }

  const reason =
    typeof reasonRaw === "string" && reasonRaw.trim().length > 0
      ? reasonRaw.trim()
      : null;

  const employeeName = user.name?.trim() || user.email || "Unknown";

  const created = await createLeave({
    userId: user.id,
    employeeName,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  revalidatePath("/leaves");
  redirect(`/leaves/${created.id}`);
}

export async function approveLeaveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Missing leave id");
  }

  await approveLeave({ id, adminId: admin.id });
  revalidatePath("/leaves");
  revalidatePath(`/leaves/${id}`);
}

export async function rejectLeaveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Missing leave id");
  }

  await rejectLeave({ id, adminId: admin.id });
  revalidatePath("/leaves");
  revalidatePath(`/leaves/${id}`);
}
