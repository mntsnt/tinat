"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

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

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
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

      window.location.href = destination;
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 py-12 md:py-24">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <Link href="/" className="transition-transform hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white font-bold text-2xl shadow-md">
                T
              </div>
            </Link>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => router.push(`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`)}
                >
                  Verify Email Now
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4 space-y-2">
              <div>
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline transition-colors">
                  Create one
                </Link>
              </div>
              <div className="text-xs">
                Already registered but haven't verified?{" "}
                <Link href="/verify-email" className="font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors">
                  Verify your email
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}