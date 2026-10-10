interface GoogleAuthButtonProps {
  role?: "PARTICIPANT" | "RESEARCHER";
  label: string;
}

export function GoogleAuthButton({ role, label }: GoogleAuthButtonProps) {
  const href = role
    ? `/api/auth/google?role=${role}`
    : "/api/auth/google";

  return (
    <a
      href={href}
      className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
        <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
        <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z" />
        <path fill="#FBBC05" d="M12.8 27.8a12 12 0 0 1 0-7.6V15H5.9a20 20 0 0 0 0 17.9l6.9-5.1Z" />
        <path fill="#EA4335" d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12Z" />
      </svg>
      {label}
    </a>
  );
}
