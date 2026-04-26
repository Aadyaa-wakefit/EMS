import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/app/lib/auth";

import { NewLeaveForm } from "./NewLeaveForm";

export const metadata = {
  title: "New leave request – LMS",
};

export default async function NewLeavePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth");
  }

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  if (user.role === "admin") {
    redirect("/leaves");
  }
  const employeeName = user.name?.trim() || user.email || "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
          <CardTitle className="text-lg">New leave request</CardTitle>
          <CardDescription>
            Submit a request for time off. Your manager will review it shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewLeaveForm employeeName={employeeName} />
        </CardContent>
      </Card>
    </div>
  );
}
