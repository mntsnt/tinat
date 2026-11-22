"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  Filter,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string | null;
  fieldOfStudy: string | null;
  yearOfStudy: number | null;
  createdAt: string | Date;
  faydaVerified: boolean;
  faydaVerifiedAt: string | Date | null;
  wallet: { balance: number } | null;
  _count: {
    studies: number;
    participantLinks: number;
  };
}

interface AdminUsersClientProps {
  initialUsers: AdminUserItem[];
}

type RoleFilter = "ALL" | "RESEARCHER" | "PARTICIPANT" | "DATA_COLLECTOR" | "ADMIN";

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Compute role counts for pills
  const counts = useMemo(() => {
    return {
      all: initialUsers.length,
      researchers: initialUsers.filter((u) => u.role === "RESEARCHER").length,
      participants: initialUsers.filter((u) => u.role === "PARTICIPANT").length,
      collectors: initialUsers.filter((u) => u.role === "DATA_COLLECTOR").length,
      admins: initialUsers.filter((u) => u.role === "ADMIN").length,
      verified: initialUsers.filter((u) => u.faydaVerified).length,
    };
  }, [initialUsers]);

  // Filter users based on search query, role, and verification
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return initialUsers.filter((user) => {
      // Role filter
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      // Verified toggle
      if (verifiedOnly && !user.faydaVerified) {
        return false;
      }

      // Search query filter
      if (!q) return true;

      const nameMatch = user.name?.toLowerCase().includes(q) ?? false;
      const emailMatch = user.email?.toLowerCase().includes(q) ?? false;
      const instMatch = user.institution?.toLowerCase().includes(q) ?? false;
      const fieldMatch = user.fieldOfStudy?.toLowerCase().includes(q) ?? false;
      const roleMatch = user.role?.toLowerCase().includes(q) ?? false;

      return nameMatch || emailMatch || instMatch || fieldMatch || roleMatch;
    });
  }, [initialUsers, searchQuery, roleFilter, verifiedOnly]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, institution, or field..."
              className="w-full h-10 rounded-xl border border-border bg-background/80 pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Fayda Verified Filter Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all ${
                verifiedOnly
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Verified Only</span>
              <span className="ml-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-mono">
                {counts.verified}
              </span>
            </button>
          </div>
        </div>

        {/* Role Filter Pills Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Users ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("RESEARCHER")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "RESEARCHER"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Researchers ({counts.researchers})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("PARTICIPANT")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "PARTICIPANT"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Participants ({counts.participants})
          </button>
          {counts.collectors > 0 && (
            <button
              type="button"
              onClick={() => setRoleFilter("DATA_COLLECTOR")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                roleFilter === "DATA_COLLECTOR"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              Data Collectors ({counts.collectors})
            </button>
          )}
          <button
            type="button"
            onClick={() => setRoleFilter("ADMIN")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              roleFilter === "ADMIN"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Admins ({counts.admins})
          </button>

          {/* Active Results Count */}
          <div className="ml-auto text-xs text-muted-foreground font-medium pl-2 hidden sm:block">
            Showing <span className="font-bold text-foreground">{filteredUsers.length}</span> of {initialUsers.length} users
          </div>
        </div>
      </div>

      {/* Users Table or Empty Results */}
      {filteredUsers.length === 0 ? (
        <Card className="bg-muted/30 border border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                No users found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {searchQuery
                  ? `No user records matched "${searchQuery}". Try searching by another name, email, or institution.`
                  : "There are no users matching the selected filters."}
              </p>
            </div>
            {(searchQuery || roleFilter !== "ALL" || verifiedOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                  setVerifiedOnly(false);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                Clear All Filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-3.5">User</th>
                  <th scope="col" className="px-6 py-3.5">Role</th>
                  <th scope="col" className="px-6 py-3.5">Academic & Institutional</th>
                  <th scope="col" className="px-6 py-3.5">Activity</th>
                  <th scope="col" className="px-6 py-3.5">Joined</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const createdDate =
                    typeof user.createdAt === "string"
                      ? new Date(user.createdAt)
                      : user.createdAt;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Link
                            href={`/profile/${user.id}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {user.name}
                          </Link>
                          {user.faydaVerified && (
                            <span
                              title={`Fayda Verified`}
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-full px-2 py-0.5 border border-emerald-500/25 text-[10px] font-bold"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {user.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <Badge
                          variant={
                            user.role === "ADMIN"
                              ? "warning"
                              : user.role === "RESEARCHER"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 align-top">
                        {user.institution ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-foreground font-medium">
                              <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]" title={user.institution}>
                                {user.institution}
                              </span>
                            </div>
                            {user.fieldOfStudy && (
                              <div className="flex items-center text-xs text-muted-foreground pl-5">
                                <span>{user.fieldOfStudy}</span>
                              </div>
                            )}
                            {user.yearOfStudy && (
                              <div className="text-xs text-muted-foreground pl-5">
                                Year {user.yearOfStudy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            No details provided
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top">
                        {user.role === "PARTICIPANT" && (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between w-32">
                              <span className="text-muted-foreground">Balance:</span>
                              <span className="font-semibold text-foreground font-mono">
                                {user.wallet?.balance ?? 0} Birr
                              </span>
                            </div>
                            <div className="flex justify-between w-32">
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="font-semibold text-foreground font-mono">
                                {user._count.participantLinks}
                              </span>
                            </div>
                          </div>
                        )}

                        {user.role === "RESEARCHER" && (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between w-32">
                              <span className="text-muted-foreground">Studies:</span>
                              <span className="font-semibold text-foreground font-mono">
                                {user._count.studies} created
                              </span>
                            </div>
                          </div>
                        )}

                        {user.role === "DATA_COLLECTOR" && (
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between w-32">
                              <span className="text-muted-foreground">Interviews:</span>
                              <span className="font-semibold text-foreground font-mono">
                                {user._count.participantLinks} completed
                              </span>
                            </div>
                          </div>
                        )}

                        {user.role === "ADMIN" && (
                          <span className="text-muted-foreground italic text-xs">System Admin</span>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {createdDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-4 align-top text-right">
                        <Link
                          href={`/profile/${user.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <span>View</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
