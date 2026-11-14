"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { TinatLogo } from "../components/ui/TinatLogo";
import { ThemeToggle } from "../components/ThemeToggle";

const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  authorization_denied: "Google sign-in was cancelled. You can try again or use your email and password.",
  configuration_error: "Google sign-in is not configured yet. Please use your email and password.",
  google_sign_in_failed: "Google sign-in could not be completed. Please try again.",
  internal_error: "Something went wrong while signing in with Google. Please try again.",
  invalid_state: "Your sign-in session expired or could not be verified. Please try again.",
  profile_fetch_failed: "We could not retrieve your Google profile. Please try again.",
  token_exchange_failed: "Google could not complete sign-in. Please try again.",
  unverified_email: "Google requires a verified email address to sign in.",
};

type LoginResponse = {
  message?: string;
  error?: string;
  isVerified?: boolean;
  email?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "PARTICIPANT" | "RESEARCHER" | "ADMIN";
  };
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const { error: googleErrorCode } = use(searchParams);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const googleError = googleErrorCode
    ? GOOGLE_AUTH_ERRORS[googleErrorCode] ||
      "Google sign-in could not be completed. Please try again."
    : "";
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        if (data.isVerified === false) {
          setUnverifiedEmail(data.email || email);
          setError(data.error || "Please verify your email before accessing the platform.");
          return;
        }
        setError(data.error || "Login failed.");
        return;
      }

      if (!data.user) {
        setError("Login succeeded, but user information is missing.");
        return;
      }

      let destination = "/participant";
      if (data.user.role === "ADMIN") {
        destination = "/admin";
      } else if (data.user.role === "RESEARCHER") {
        destination = "/researcher";
      }

      router.push(destination);
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-background selection:bg-emerald-500/20">
      {/* Top Left Header with Brand Logo and Name */}
      <header className="w-full px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
        >
          <TinatLogo size={28} showText variant="color" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <Link href="/" className="transition-transform hover:scale-105">
                <TinatLogo size={48} variant="color" />
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {googleError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {googleError}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive font-medium">
                {error}
              </div>
            )}

            {unverifiedEmail && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm space-y-2">
                <p className="text-amber-700 dark:text-amber-400 font-medium">
                  Your account requires email verification before access is granted.
                </p>
                {resendStatus && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {resendStatus}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
                  >
                    Enter Code
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    disabled={resendingCode}
                    onClick={async () => {
                      setResendingCode(true);
                      setResendStatus(null);
                      try {
                        const res = await fetch("/api/auth/resend-verification", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: unverifiedEmail }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setResendStatus("New verification code sent to your email!");
                        } else {
                          setResendStatus(data.error || "Failed to resend code.");
                        }
                      } catch {
                        setResendStatus("Network error resending code.");
                      } finally {
                        setResendingCode(false);
                      }
                    }}
                  >
                    {resendingCode ? "Sending..." : "Resend Code"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" isLoading={loading}>
              Sign In
            </Button>

            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <GoogleAuthButton label="Continue with Google" />

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline transition-colors">
                Create one
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      </div>
    </main>
  );
}
