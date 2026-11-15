"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/app/components/ui/Button";
import { StatusPanel } from "@/app/components/ui/StatusPanel";

export default function StudyDiscoveryError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Study discovery error:", error);
  }, [error]);

  return (
    <StatusPanel
      tone="error"
      eyebrow="Study discovery"
      title="We couldn’t load the studies"
      description="Your account is okay. The study list is temporarily unavailable; try again in a moment or return to your dashboard."
      reference={error.digest}
    >
      <Button onClick={retry}>Try again</Button>
      <ButtonLink href="/participant" variant="outline">
        Return to dashboard
      </ButtonLink>
    </StatusPanel>
  );
}
