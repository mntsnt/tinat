"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Activity, BarChart3, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

type TrendPoint = {
  date: string;
  users: number;
  studies: number;
  responses: number;
};

type DistributionPoint = {
  name: string;
  value: number;
};

type Props = {
  growthData: TrendPoint[];
  roleDistribution: DistributionPoint[];
  studyStatusDistribution: DistributionPoint[];
  verificationDistribution: DistributionPoint[];
};

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
  fontSize: "12px",
};

const roleColors = ["#2563eb", "#10b981", "#f43f5e"];
const studyColors = ["#10b981", "#64748b", "#f59e0b", "#8b5cf6"];
const verificationColors = ["#f59e0b", "#10b981", "#f43f5e", "#64748b"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[190px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
      No {label} data to display yet.
    </div>
  );
}

export function AdminCharts({
  growthData,
  roleDistribution,
  studyStatusDistribution,
  verificationDistribution,
}: Props) {
  const hasTrend = growthData.some((item) => item.users + item.studies + item.responses > 0);

  return (
    <div className="min-w-0 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Platform activity</CardTitle>
          </div>
          <CardDescription>Daily registrations, studies, and responses · last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminUsersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminStudiesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminResponsesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickFormatter={(date: string) => format(parseISO(date), "MMM d")}
                    minTickGap={24}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    allowDecimals={false}
                    width={34}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(date) => format(parseISO(String(date)), "MMM d, yyyy")}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="users" name="New users" stroke="#2563eb" strokeWidth={2} fill="url(#adminUsersFill)" />
                  <Area type="monotone" dataKey="studies" name="New studies" stroke="#10b981" strokeWidth={2} fill="url(#adminStudiesFill)" />
                  <Area type="monotone" dataKey="responses" name="Responses" stroke="#8b5cf6" strokeWidth={2} fill="url(#adminResponsesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart label="platform activity" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-3.5 w-3.5 text-blue-600" /> Account mix</CardTitle>
            <CardDescription className="text-xs">Current user roles</CardDescription>
          </CardHeader>
          <CardContent>
            {roleDistribution.some((item) => item.value > 0) ? (
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleDistribution} dataKey="value" nameKey="name" innerRadius={43} outerRadius={66} paddingAngle={3}>
                      {roleDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={roleColors[index % roleColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="account" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm"><BarChart3 className="h-3.5 w-3.5 text-emerald-600" /> Study lifecycle</CardTitle>
            <CardDescription className="text-xs">Studies by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {studyStatusDistribution.some((item) => item.value > 0) ? (
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyStatusDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Studies" radius={[4, 4, 0, 0]} maxBarSize={34}>
                      {studyStatusDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={studyColors[index % studyColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="study" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-3.5 w-3.5 text-violet-600" /> Verification</CardTitle>
            <CardDescription className="text-xs">Verification request outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            {verificationDistribution.some((item) => item.value > 0) ? (
              <div className="h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={verificationDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Requests" radius={[4, 4, 0, 0]} maxBarSize={34}>
                      {verificationDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={verificationColors[index % verificationColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart label="verification" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
