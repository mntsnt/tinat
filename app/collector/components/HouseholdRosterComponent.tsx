"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  Sparkles,
  User,
  GraduationCap,
  Heart,
  Calendar,
} from "lucide-react";
import { HouseholdMember, HouseholdRosterData, createDefaultRoster } from "@/lib/studyLogic";

interface HouseholdRosterComponentProps {
  value: any;
  onChange: (rosterData: HouseholdRosterData) => void;
  onSyncCounts?: (maleCount: number, femaleCount: number) => void;
}

const ROLES = [
  "Household Head",
  "Spouse",
  "Son / Daughter",
  "Parent (Father/Mother)",
  "Brother / Sister",
  "Grandchild",
  "Other Relative",
  "Non-relative / Worker",
];

const MARITAL_STATUSES = [
  "Married",
  "Single (Never Married)",
  "Divorced",
  "Widowed",
];

const EDUCATION_LEVELS = [
  "Unable to read and write (Illiterate)",
  "Able only to read and write",
  "Primary school (Grades 1-8)",
  "Secondary school (Grades 9-12)",
  "College / University graduate (12+)",
];

export function HouseholdRosterComponent({
  value,
  onChange,
  onSyncCounts,
}: HouseholdRosterComponentProps) {
  // Initialize roster from existing answer or default
  const [roster, setRoster] = useState<HouseholdRosterData>(() => {
    if (value && typeof value === "object" && Array.isArray(value.members)) {
      return value;
    }
    const initialCount = typeof value === "number" ? value : 3;
    return createDefaultRoster(initialCount);
  });

  const updateRoster = (newMembers: HouseholdMember[]) => {
    const maleCount = newMembers.filter((m) => m.sex === "Male").length;
    const femaleCount = newMembers.filter((m) => m.sex === "Female").length;
    const updated: HouseholdRosterData = {
      total: newMembers.length,
      maleCount,
      femaleCount,
      members: newMembers,
    };
    setRoster(updated);
    onChange(updated);
    if (onSyncCounts) {
      onSyncCounts(maleCount, femaleCount);
    }
  };

  const updateMember = (index: number, field: keyof HouseholdMember, val: any) => {
    const newMembers = [...roster.members];
    const target = { ...newMembers[index], [field]: val };
    newMembers[index] = target;
    updateRoster(newMembers);
  };

  const addMember = () => {
    if (roster.members.length >= 20) return;
    const nextIdx = roster.members.length + 1;
    const newMember: HouseholdMember = {
      id: `member-${Date.now()}-${nextIdx}`,
      role: nextIdx === 2 ? "Spouse" : "Son / Daughter",
      sex: nextIdx % 2 === 0 ? "Female" : "Male",
      age: 18,
      maritalStatus: "Single (Never Married)",
      education: "Primary school (Grades 1-8)",
    };
    updateRoster([...roster.members, newMember]);
  };

  const removeMember = (index: number) => {
    if (roster.members.length <= 1) return;
    const newMembers = roster.members.filter((_, i) => i !== index);
    updateRoster(newMembers);
  };

  return (
    <div className="space-y-4">
      {/* Header Deck: Total Members & Male/Female Breakdown */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Dynamic Household Roster</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live Census Table
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demographic records for all permanent family members
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-foreground flex items-center gap-1.5 shadow-xs">
            <span>Total:</span>
            <span className="text-emerald-600 text-sm">{roster.total}</span>
          </span>
          <span className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-700 dark:text-sky-300">
            {roster.maleCount} Male
          </span>
          <span className="px-2.5 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-700 dark:text-pink-300">
            {roster.femaleCount} Female
          </span>
        </div>
      </div>

      {/* Roster Cards List */}
      <div className="space-y-3">
        {roster.members.map((member, index) => (
          <div
            key={member.id}
            className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition hover:border-border/80 space-y-3"
          >
            {/* Card Top: Member Badge & Role Dropdown */}
            <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  #{index + 1}
                </span>
                <select
                  value={member.role}
                  onChange={(e) => updateMember(index, "role", e.target.value)}
                  className="text-xs sm:text-sm font-bold text-foreground bg-muted/40 border border-border rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-600"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                  title="Remove Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Member Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Sex Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Sex</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-0.5 rounded-xl border border-border bg-muted/20">
                  <button
                    type="button"
                    onClick={() => updateMember(index, "sex", "Male")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      member.sex === "Male"
                        ? "bg-sky-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMember(index, "sex", "Female")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition ${
                      member.sex === "Female"
                        ? "bg-pink-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Age Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={member.age}
                  onChange={(e) => updateMember(index, "age", Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:border-emerald-600 text-center font-mono"
                  placeholder="Age"
                />
              </div>

              {/* Marital Status Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Heart className="w-3 h-3 text-emerald-600" />
                  <span>Marital Status</span>
                </label>
                <select
                  value={member.maritalStatus}
                  onChange={(e) => updateMember(index, "maritalStatus", e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-600"
                >
                  {MARITAL_STATUSES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Education Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-emerald-600" />
                  <span>Education</span>
                </label>
                <select
                  value={member.education}
                  onChange={(e) => updateMember(index, "education", e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-emerald-600 truncate"
                >
                  {EDUCATION_LEVELS.map((ed) => (
                    <option key={ed} value={ed}>
                      {ed}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Button & Census Auto-Sync Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={addMember}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Family Member #{roster.members.length + 1}</span>
        </button>

        <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Auto-syncs male ({roster.maleCount}) &amp; female ({roster.femaleCount}) to census indicators</span>
        </div>
      </div>
    </div>
  );
}
