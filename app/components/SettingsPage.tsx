"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Loader2,
  LockKeyhole,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { FaydaVerification } from "./FaydaVerification";
import { Button } from "./ui/Button";

type UserData = {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  role: string;
  createdAt: Date;
  avatarUrl?: string | null;
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    bio: user.bio || "",
    institution: user.institution || "",
    fieldOfStudy: user.fieldOfStudy || "",
  });
  const [activeSection, setActiveSection] = useState("account");
  const contentScrollRef = useRef<HTMLDivElement>(null);

  async function processAndUploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file (PNG, JPG, or WebP).");
      setAvatarMessage("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image is too large. Please select an image under 5MB.");
      setAvatarMessage("");
      return;
    }

    setAvatarLoading(true);
    setAvatarError("");
    setAvatarMessage("");

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Could not process image canvas."));
              return;
            }

            // Square center crop
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;

            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

            const output = canvas.toDataURL("image/webp", 0.85);
            resolve(output);
          };
          img.onerror = () => reject(new Error("Failed to load image."));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload profile picture.");
      }

      setAvatarUrl(data.avatarUrl);
      setAvatarMessage("Profile picture updated successfully.");
      router.refresh();
    } catch (err: unknown) {
      console.error("Avatar upload error:", err);
      setAvatarError(err instanceof Error ? err.message : "Could not upload profile picture.");
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  async function handleAvatarDelete() {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;
    setAvatarLoading(true);
    setAvatarError("");
    setAvatarMessage("");

    try {
      const res = await fetch("/api/auth/avatar", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove profile picture.");
      }

      setAvatarUrl(null);
      setAvatarMessage("Profile picture removed.");
      router.refresh();
    } catch (err: unknown) {
      console.error("Avatar delete error:", err);
      setAvatarError(err instanceof Error ? err.message : "Could not remove profile picture.");
    } finally {
      setAvatarLoading(false);
    }
  }

  useEffect(() => {
    const container = contentScrollRef.current;
    if (!container) return;

    const sections = container.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: "-5% 0px -65% 0px",
        threshold: 0.1,
      }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const container = contentScrollRef.current;
    const target = document.getElementById(id);
    if (target && container) {
      setActiveSection(id);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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
    <div className="flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 mx-auto">
      <header className="mb-4 flex shrink-0 items-start justify-between gap-4 sm:mb-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Account
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-muted-foreground">
            Manage your profile, account details, and appearance in one place.
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-1 lg:gap-8 items-start">
        <nav
          aria-label="Settings sections"
          onWheel={(e) => {
            if (contentScrollRef.current) {
              contentScrollRef.current.scrollTop += e.deltaY;
            }
          }}
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 lg:flex-col lg:h-fit shrink-0 shadow-2xs select-none"
        >
          {[
            { id: "account", label: "Account overview", icon: CircleUserRound },
            { id: "profile", label: "Profile information", icon: UserRound },
            { id: "security", label: "Security", icon: ShieldCheck },
            { id: "appearance", label: "Appearance", icon: Palette },
            ...(user.faydaVerified !== undefined
              ? [{ id: "verification", label: "Verification", icon: CheckCircle }]
              : []),
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="whitespace-nowrap">{item.label}</span>
                <ChevronRight
                  className={`ml-auto hidden h-3.5 w-3.5 lg:block transition-transform ${
                    isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/40"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div
          ref={contentScrollRef}
          className="min-h-0 min-w-0 flex-1 h-full space-y-5 overflow-y-auto overscroll-contain pr-2 scroll-smooth [scrollbar-gutter:stable]"
        >
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
            <div className="flex flex-wrap items-center gap-5 px-5 py-5 sm:px-6">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void processAndUploadAvatar(file);
                }}
                className="hidden"
              />

              <div className="group relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm ring-2 ring-primary/10">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary text-lg sm:text-xl font-bold text-primary-foreground">
                    {initials}
                  </div>
                )}

                {avatarLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-primary">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    title="Change profile picture"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-[10px] font-medium mt-0.5">Change</span>
                  </button>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="truncate text-base font-semibold text-foreground">{user.name}</h3>
                  {user.username && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                      @{user.username}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.isVerified
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}>
                    {user.isVerified ? <CheckCircle className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                    {user.isVerified ? "Email verified" : "Email not verified"}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarLoading}
                    className="gap-1.5 text-xs h-7 px-2.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{avatarUrl ? "Change photo" : "Upload photo"}</span>
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAvatarDelete}
                      disabled={avatarLoading}
                      className="gap-1.5 text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    JPG, PNG, or WebP (max 5MB, auto-cropped)
                  </span>
                </div>

                {avatarMessage && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> {avatarMessage}
                  </p>
                )}
                {avatarError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {avatarError}
                  </p>
                )}
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
                <Link
                  href={`/verify-email?email=${encodeURIComponent(user.email)}`}
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Verify email
                </Link>
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
                  <label htmlFor="settings-username" className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Username</span>
                    <span className="text-[11px] text-muted-foreground">Tinat &amp; Tinat Ask</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground select-none">
                      @
                    </span>
                    <input
                      id="settings-username"
                      name="username"
                      value={formData.username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                        setFormData((prev) => ({ ...prev, username: val }));
                      }}
                      maxLength={30}
                      autoComplete="username"
                      placeholder="username"
                      className={`${inputClassName} pl-8 font-mono`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Unique handle for your profile, Tinat Ask, and field collector assignment.
                  </p>
                </div>
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
