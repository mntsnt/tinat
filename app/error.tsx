"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "./components/ui/Button";
import { Home, RotateCcw } from "lucide-react";
import { StatusPanel } from "./components/ui/StatusPanel";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <StatusPanel
      tone="error"
      eyebrow="Tinat needs a moment"
      title="Something didn’t go as planned"
      description="We couldn’t complete that request. Try again, or return to the home page and continue from there."
      reference={error.digest}
    >
        <Button onClick={retry} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <ButtonLink href="/" variant="outline" className="gap-2">
          <Home className="w-4 h-4" />
          Return home
        </ButtonLink>
    </StatusPanel>
  );
}
