"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";

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
  passwordHash: string;
};

import { UserCircle, Lock, Edit } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      setMessage("Settings updated successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Utilities for rendering profile info
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const formattedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const maskedPhone = user.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-3)}` : 'Not provided';
  const shortId = `#${user.id.slice(-4).toUpperCase()}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and payment preferences</p>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-emerald-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.phone || 'No phone number added'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Phone</p>
              <p className="font-medium text-foreground">{maskedPhone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Account ID</p>
              <p className="font-medium text-foreground">{shortId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Member Since</p>
              <p className="font-medium text-foreground">{formattedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Change your account password</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full px-4">Change</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit className="w-5 h-5 text-emerald-500" />
            Edit Information
          </CardTitle>
          <CardDescription>Update your personal details and public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 251912345678"
                  className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us a little bit about yourself..."
                className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {user.role === "RESEARCHER" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution</label>
                  <input
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder="E.g., Stanford University"
                    className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field of Study</label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={handleChange}
                    placeholder="E.g., Cognitive Psychology"
                    className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            {message && <p className="text-sm text-green-600 font-medium">{message}</p>}
            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the theme of the application.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
