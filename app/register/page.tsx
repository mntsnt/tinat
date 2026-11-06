"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { TinatLogo } from "../components/ui/TinatLogo";
import { AuthStepper } from "../components/auth/AuthStepper";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PARTICIPANT" | "RESEARCHER">("PARTICIPANT");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const draftStr = sessionStorage.getItem("tinat_registration_draft");
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.name) setName(draft.name);
        if (draft.email) setEmail(draft.email);
        if (draft.role) setRole(draft.role);
        if (draft.password) setPassword(draft.password);
      }
    } catch {
      // Ignore sessionStorage read errors
    }
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      sessionStorage.setItem(
        "tinat_registration_draft",
        JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        })
      );
      router.push("/agreement?flow=signup");
    } catch {
      setError("Unable to save registration details. Please check your browser storage settings.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 py-8 md:py-12">
      <Card className="w-full max-w-lg shadow-xl border-border bg-card">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <Link href="/" className="transition-transform hover:scale-105">
              <TinatLogo size={52} variant="color" />
            </Link>
          </div>
          <AuthStepper currentStep={1} />
          <CardTitle className="text-2xl font-bold tracking-tight">Create your account</CardTitle>
          <CardDescription>
            Join Tinat to participate in clinical studies or lead health research.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-2">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Dr. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password (min 8 characters)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
            />
            <div className="space-y-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                I am joining as a
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                value={role}
                onChange={(e) => setRole(e.target.value === "RESEARCHER" ? "RESEARCHER" : "PARTICIPANT")}
              >
                <option value="PARTICIPANT">Study Participant / Contributor</option>
                <option value="RESEARCHER">Clinical Researcher / Principal Investigator</option>
              </select>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              isLoading={submitting}
              disabled={submitting}
            >
              <span>Continue to Platform Agreement</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or sign up with</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <GoogleAuthButton role={role} label="Sign up with Google" />

            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
