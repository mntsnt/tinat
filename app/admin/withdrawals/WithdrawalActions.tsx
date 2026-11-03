"use client";

import { Badge } from "../../components/ui/Badge";

type Props = {
  withdrawalId?: string;
  status?: string;
};

export default function WithdrawalActions({ status }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full mt-4 pt-3 border-t border-border">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Processing Status:</span>
        <Badge variant={status === "APPROVED" ? "success" : "secondary"}>
          {status === "PENDING" ? "Paused (Read-Only)" : status || "Archived"}
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        Payout operations are paused. No external funds can be disbursed.
      </p>
    </div>
  );
}
