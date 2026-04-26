import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { approveLeaveAction, rejectLeaveAction } from "../actions";

type Variant = "inline" | "block";

export function LeaveDecisionForm({
  id,
  variant = "inline",
}: {
  id: string;
  variant?: Variant;
}) {
  if (variant === "block") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <form action={approveLeaveAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="lg" className="gap-1.5">
            <Check className="size-4" /> Approve
          </Button>
        </form>
        <form action={rejectLeaveAction}>
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            size="lg"
            variant="destructive"
            className="gap-1.5"
          >
            <X className="size-4" /> Reject
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <form action={approveLeaveAction}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" variant="outline" className="gap-1">
          <Check className="size-3.5" /> Approve
        </Button>
      </form>
      <form action={rejectLeaveAction}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          className="gap-1"
        >
          <X className="size-3.5" /> Reject
        </Button>
      </form>
    </div>
  );
}
