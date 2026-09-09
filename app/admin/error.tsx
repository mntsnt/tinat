"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>
      <div className="p-4 bg-red-50 text-red-800 rounded-md max-w-2xl overflow-auto text-sm font-mono border border-red-200">
        <p className="font-bold">Error Message:</p>
        <p>{error.message}</p>
        {error.stack && (
          <>
            <p className="font-bold mt-2">Stack Trace:</p>
            <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
          </>
        )}
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
