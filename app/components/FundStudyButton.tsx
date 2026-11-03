"use client";

import { Button } from "./ui/Button";
import { CREDITS_DISCLAIMER } from "@/lib/config/features";

type FundStudyButtonProps = {
  studyId: string;
  amount?: number;
};

export default function FundStudyButton({
  studyId,
  amount,
}: FundStudyButtonProps) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 border border-border text-xs text-muted-foreground">
      <p className="font-semibold text-foreground mb-1">Zero-Cost Study Allocation</p>
      <p>
        Studies on Tinat are created and funded at zero monetary cost using Tinat Credits. No payment gateway deposits are required.
      </p>
      <p className="mt-1 text-[11px] italic">{CREDITS_DISCLAIMER}</p>
    </div>
  );
}
