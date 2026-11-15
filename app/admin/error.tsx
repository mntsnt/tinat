"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { StatusPanel } from "../components/ui/StatusPanel";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <StatusPanel
      tone="error"
      eyebrow="Admin workspace"
      title="This section is temporarily unavailable"
      description="Try again in a moment. If the problem continues, contact Tinat support and include the reference below."
      reference={error.digest}
    >
      <Button onClick={retry}>Try again</Button>
      <ButtonLink href="/admin" variant="outline">Return to overview</ButtonLink>
    </StatusPanel>
  );
}
