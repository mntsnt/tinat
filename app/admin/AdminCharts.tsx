"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { format, parseISO, subDays } from "date-fns";
import { Server, Activity, Database, Cpu, MemoryStick } from "lucide-react";

export function AdminCharts({
  growthData,
  roleDistribution,
  systemMetrics,
}: {
  growthData: any[];
  roleDistribution: any[];
  systemMetrics: any;
}) {
  const COLORS = ["#0ea5e9", "#10b981", "#f43f5e", "#f59e0b"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-xl">
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const bytesToMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";
  const bytesToGB = (bytes: number) => (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2 mb-4 text-primary font-bold text-lg">
        <Activity className="w-5 h-5" />
        <h2>Platform Analytics & Health</h2>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Platform Growth (Last 30 Days)</CardTitle>
            <CardDescription>New user registrations and studies published</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={growthData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStudies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(val) => format(parseISO(val), "MMM d")}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12 }} 
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="New Users"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="studies"
                    name="New Studies"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudies)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Roles Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">User Roles</CardTitle>
            <CardDescription>Current platform demographics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics (Nerdy Stuff) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> Server Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono text-emerald-400">
              {Math.floor(systemMetrics.uptime / 3600)}h {Math.floor((systemMetrics.uptime % 3600) / 60)}m
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Node.js process uptime</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MemoryStick className="w-3.5 h-3.5" /> Memory Heap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono text-sky-400">
              {bytesToMB(systemMetrics.memory.heapUsed)}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div 
                className="bg-sky-500 h-1.5 rounded-full" 
                style={{ width: `${Math.min(100, (systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100)}%` }} 
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>Used</span>
              <span>{bytesToMB(systemMetrics.memory.heapTotal)} Total</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> OS Load (1m)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono text-rose-400">
              {systemMetrics.loadAvg[0].toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Host OS load average
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono text-amber-400">
              {systemMetrics.dbRecords.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Users + Studies + Responses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
