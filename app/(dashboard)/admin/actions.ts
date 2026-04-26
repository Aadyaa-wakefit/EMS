"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/app/lib/auth";
import { setUserRole, type UserRole } from "@/app/lib/users-repo";

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
