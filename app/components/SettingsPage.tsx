"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronRight,
  CircleUserRound,
  Clock3,
  LockKeyhole,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { FaydaVerification } from "./FaydaVerification";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  role: string;
  createdAt: Date;
  isVerified?: boolean;
  faydaVerified?: boolean;
  faydaVerifiedAt?: Date | null;
};

const inputClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

export default function SettingsPage({ user }: { user: UserData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    bio: user.bio || "",
    institution: user.institution || "",
    fieldOfStudy: user.fieldOfStudy || "",
  });

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "T";
  const roleLabel = user.role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not update your profile.");

      setMessage("Your profile has been updated.");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not update your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Manage your profile, account details, and appearance in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:sticky lg:top-6 lg:flex-col"
        >
          {[
            { href: "#account", label: "Account overview", icon: CircleUserRound },
            { href: "#profile", label: "Profile information", icon: UserRound },
            { href: "#security", label: "Security", icon: ShieldCheck },
            { href: "#appearance", label: "Appearance", icon: Palette },
            ...(user.faydaVerified !== undefined
              ? [{ href: "#verification", label: "Verification", icon: CheckCircle }]
              : []),
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.label}</span>
                <ChevronRight className="ml-auto hidden h-3.5 w-3.5 lg:block" />
              </a>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          <section
            id="account"
            className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Account overview</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your Tinat account at a glance.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {roleLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-foreground">{user.name}</h3>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  user.isVerified
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}>
                  {user.isVerified ? <CheckCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                  {user.isVerified ? "Email verified" : "Email not verified"}
                </span>
              </div>
            </div>
            <div className="grid gap-4 border-t border-border bg-muted/30 px-5 py-4 sm:grid-cols-2 sm:px-6">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email</span>
                <span className="ml-auto max-w-[65%] truncate font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since</span>
                <span className="ml-auto font-medium text-foreground">{memberSince}</span>
              </div>
            </div>
            {!user.isVerified && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:px-6">
                <p className="text-xs text-muted-foreground">
                  Verify your email to secure your account and access all features.
                </p>
                <a
                  href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Verify email
                </a>
              </div>
            )}
          </section>

          <section
            id="profile"
            className="scroll-mt-6 rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-sm font-semibold text-foreground">Profile information</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                These details help other people understand who you are on Tinat.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="settings-name" className="text-xs font-medium text-foreground">Full name</label>
                  <input
                    id="settings-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="name"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settings-phone" className="text-xs font-medium text-foreground">Phone number</label>
                  <input
                    id="settings-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="Add a contact number"
                    className={inputClassName}
                  />
                </div>
              </div>

              {user.role === "RESEARCHER" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="settings-institution" className="text-xs font-medium text-foreground">Institution</label>
                    <input
                      id="settings-institution"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Your university or organization"
                      className={inputClassName}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="settings-field" className="text-xs font-medium text-foreground">Field of study</label>
                    <input
                      id="settings-field"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="Your research area"
                      className={inputClassName}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="settings-bio" className="text-xs font-medium text-foreground">About you</label>
                <textarea
                  id="settings-bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="A short introduction for your profile"
                  className={`${inputClassName} resize-y`}
                />
                <p className="text-right text-[11px] text-muted-foreground">{formData.bio.length}/500</p>
              </div>

              {message && (
                <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4" /> {message}
                </p>
              )}
              {error && (
                <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section
              id="security"
              className="scroll-mt-6 rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Security</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Keep your account details current and your email verified.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-foreground">Sign-in email</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.isVerified ? "Verified and ready to use" : "Email verification is recommended"}
                </p>
              </div>
            </section>

            <section
              id="appearance"
              className="scroll-mt-6 rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Palette className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Choose a light or dark theme for Tinat.
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </section>
          </div>

          {user.faydaVerified !== undefined && (
            <section
              id="verification"
              className="scroll-mt-6 rounded-xl border border-border bg-card p-5 sm:p-6"
            >
              <FaydaVerification
                isVerified={user.faydaVerified}
                verifiedAt={user.faydaVerifiedAt}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
