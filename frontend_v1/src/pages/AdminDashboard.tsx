import { useEffect, useState } from "react";
import { getTools, getDelegations, getStudents } from "@/lib/api";
import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { initialTools, initialDelegations, initialStudents } from "@/data/placeholderData";
import {
  Package, PackageCheck, PackageX, AlertTriangle, Send, TrendingUp, Ban,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = [
  "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(217, 91%, 48%)",
];

const AdminDashboard = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const totalQty = tools.reduce((s, t) => s + t.quantity, 0);
  const issuedQty = tools.reduce((s, t) => s + t.issuedQty, 0);
  const availableQty = totalQty - issuedQty;
  const outOfStock = tools.filter(t => t.status === "Out of Stock").length;
  const lowStock = tools.filter(t => t.status === "Low Stock").length;
  const overdueCount = delegations.filter(d => d.status === "Overdue").length;
  const lostCount = delegations.filter(d => d.status === "Lost").length;
  const bannedStudents = initialStudents.filter(s => s.accountStatus === "Banned").length;

  const statusBarData = [
    { name: "Available", count: tools.filter(t => t.status === "Available").length },
    { name: "Partial", count: tools.filter(t => t.status === "Partially Issued").length },
    { name: "Low Stock", count: tools.filter(t => t.status === "Low Stock").length },
    { name: "Out of Stock", count: tools.filter(t => t.status === "Out of Stock").length },
  ];
  const pieData = statusBarData.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }));

  const recentDelegations = useMemo(() =>
    [...delegations].sort((a, b) => b.dateIssued.localeCompare(a.dateIssued)).slice(0, 8),
    [delegations]
  );

  const lowStockItems = useMemo(() =>
    tools.filter(t => t.status === "Low Stock" || t.status === "Out of Stock")
      .sort((a, b) => (a.quantity - a.issuedQty) - (b.quantity - b.issuedQty)).slice(0, 6),
    [tools]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <StatCard title="Total Tools" value={tools.length} icon={Package} />
          <StatCard title="Total Qty" value={totalQty} icon={Package} />
          <StatCard title="Available" value={availableQty} icon={PackageCheck} variant="success" />
          <StatCard title="Issued" value={issuedQty} icon={Send} variant="warning" />
          <StatCard title="Low Stock" value={lowStock} icon={AlertTriangle} variant="warning" />
          <StatCard title="Out of Stock" value={outOfStock} icon={PackageX} variant="destructive" />
          <StatCard title="Lost" value={lostCount} icon={AlertTriangle} variant="destructive" />
          <StatCard title="Banned" value={bannedStudents} icon={Ban} variant="destructive" />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Tool Status Overview</h3>
            {tools.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusBarData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">Distribution</h3>
            {tools.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Recent Delegations
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDelegations.length > 0 ? recentDelegations.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm">{d.toolName}</TableCell>
                      <TableCell className="text-sm">{d.studentName}</TableCell>
                      <TableCell className="font-mono text-sm">{d.quantity}</TableCell>
                      <TableCell className="text-sm">{d.dateIssued}</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No delegations yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-lg border bg-card shadow-sm">
            <div className="border-b p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Low Stock & Critical
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.length > 0 ? lowStockItems.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">{t.name}</TableCell>
                      <TableCell className="text-sm">{t.lab}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{t.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">{t.quantity - t.issuedQty}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No alerts</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
