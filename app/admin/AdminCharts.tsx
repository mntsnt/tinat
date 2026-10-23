"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";

type TrendPoint = {
  date: string;
  users: number;
  studies: number;
  responses: number;
};

type Props = {
  growthData: TrendPoint[];
};

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--card)",
  color: "var(--foreground)",
  fontSize: "12px",
};

export function AdminCharts({ growthData }: Props) {
  const hasTrend = growthData.some((item) => item.users + item.studies + item.responses > 0);

  return (
    <Card className="min-w-0">
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
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminStudiesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminResponsesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
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
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New users"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#adminUsersFill)"
                />
                <Area
                  type="monotone"
                  dataKey="studies"
                  name="New studies"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#adminStudiesFill)"
                />
                <Area
                  type="monotone"
                  dataKey="responses"
                  name="Responses"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#adminResponsesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[190px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No platform activity to display yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
