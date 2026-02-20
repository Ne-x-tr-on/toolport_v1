import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  categoryOptions, labOptions, classOptions,
} from "@/data/placeholderData";
import StatusBadge from "@/components/StatusBadge";
import {
  Package, PackageCheck, PackageX, AlertTriangle, TrendingUp,
  Users, GraduationCap, Ban, Download, Mail, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(217, 91%, 48%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 83%, 58%)", "hsl(180, 60%, 45%)",
];

const AdminReports = () => {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLab, setFilterLab] = useState("all");
  const [reportClass, setReportClass] = useState("all");

  const { data: toolsResponse, isLoading: toolsLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: api.getTools,
  });
  const tools = (toolsResponse as any) || [];

  const { data: delegationsResponse, isLoading: delegationsLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: api.getDelegations,
  });
  const delegations = (delegationsResponse as any)?.data || [];

  const { data: studentsResponse, isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: api.getStudents,
  });
  const students = (studentsResponse as any)?.data || [];

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["analytics-usage"],
    queryFn: api.getAnalyticsUsage,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: api.getAnalyticsOverview,
  });

  const isLoading = toolsLoading || delegationsLoading || studentsLoading || usageLoading || overviewLoading;

  const filteredTools = useMemo(() => {
    let result = tools;
    if (filterCategory !== "all") result = result.filter((t: any) => t.category === filterCategory);
    if (filterLab !== "all") result = result.filter((t: any) => t.lab === filterLab);
    return result;
  }, [tools, filterCategory, filterLab]);

  const stats = overview as any;
  const usageData = usage as any;

  // Derived charts based on filtered tools (local filtering)
  const statusData = [
    { name: "Available", count: filteredTools.filter((t: any) => t.status === "Available").length },
    { name: "Partially", count: filteredTools.filter((t: any) => t.status === "Partially Issued").length },
    { name: "Low Stock", count: filteredTools.filter((t: any) => t.status === "Low Stock").length },
    { name: "Out of Stock", count: filteredTools.filter((t: any) => t.status === "Out of Stock").length },
  ];

  const categoryData = useMemo(() => {
    return categoryOptions.map(cat => ({
      name: cat.length > 15 ? cat.substring(0, 15) + "..." : cat,
      total: tools.filter((t: any) => t.category === cat).reduce((s: number, t: any) => s + (t.quantity || 0), 0),
      issued: tools.filter((t: any) => t.category === cat).reduce((s: number, t: any) => s + (t.issuedQty || 0), 0),
    }));
  }, [tools]);

  // Lost tools from real delegations
  const lostDelegations = useMemo(() =>
    delegations.filter((d: any) => d.status === "Lost"),
    [delegations]
  );

  const lostToolsByStudent = useMemo(() => {
    const map: Record<string, { name: string, className: string, tools: any[], unresolvedCount: number }> = {};
    lostDelegations.forEach((d: any) => {
      if (!map[d.studentId]) {
        map[d.studentId] = {
          name: d.studentName,
          className: d.className || "Unknown",
          tools: [],
          unresolvedCount: 0,
        };
      }
      map[d.studentId].tools.push(d);
      map[d.studentId].unresolvedCount++;
    });
    return Object.entries(map).sort((a, b) => b[1].unresolvedCount - a[1].unresolvedCount);
  }, [lostDelegations]);

  const classListData = useMemo(() => {
    const filtered = reportClass === "all" ? students : students.filter((s: any) => s.className === reportClass);
    return filtered;
  }, [students, reportClass]);

  const handleSendPaymentReminder = (studentId: string) => {
    const student = students.find((s: any) => s.studentId === studentId);
    toast.success(`📧 Payment reminder sent to ${student?.name || studentId} (${student?.email || "unknown email"})`);
  };

  const handleGenerateReport = (reportType: string) => {
    toast.success(`📄 ${reportType} report generated and ready for download`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        <Tabs defaultValue="analytics">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="lost-tools">Lost Tools Report</TabsTrigger>
            <TabsTrigger value="class-list">Class List</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-4">
            <div className="flex flex-wrap gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterLab} onValueChange={setFilterLab}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Lab" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labs</SelectItem>
                  {labOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              <StatCard title="Total Items" value={stats?.totalQuantity ?? 0} icon={Package} />
              <StatCard title="Available" value={stats?.availableQuantity ?? 0} icon={PackageCheck} variant="success" />
              <StatCard title="Issued" value={stats?.issuedQuantity ?? 0} icon={PackageX} variant="warning" />
              <StatCard title="Low Stock" value={stats?.lowStockItems ?? 0} icon={AlertTriangle} variant="warning" />
              <StatCard title="Out of Stock" value={stats?.outOfStockItems ?? 0} icon={PackageX} variant="destructive" />
              <StatCard title="Overdue" value={stats?.overdueItems ?? 0} icon={AlertTriangle} variant="destructive" />
              <StatCard title="Lost" value={stats?.lostItems ?? 0} icon={Ban} variant="destructive" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Tool Status Distribution (Filtered)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Usage Trend (Monthly)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={usageData?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="issued" stroke={COLORS[0]} strokeWidth={2} name="Issued" />
                    <Line type="monotone" dataKey="returned" stroke={COLORS[1]} strokeWidth={2} name="Returned" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Most Used Tools</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={usageData?.mostUsed?.map((u: any) => ({ name: u.toolName, count: u.totalIssued })) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Times Issued" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">By Category (Total vs Issued)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill={COLORS[0]} name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issued" fill={COLORS[2]} name="Issued" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Usage by Class</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={usageData?.usageByClass?.map((u: any) => ({ name: u.className, count: u.totalIssued })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[4]} name="Qty Issued" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Usage by Lecturer</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={usageData?.usageByLecturer?.slice(0, 10).map((u: any) => ({ name: u.lecturerName.split(" ").pop(), fullName: u.lecturerName, count: u.totalIssued })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val, _name, props) => [val, props.payload.fullName]} />
                    <Bar dataKey="count" fill={COLORS[5]} name="Qty Issued" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Lost Tools Report Tab */}
          <TabsContent value="lost-tools" className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Lost Tools Report
              </h2>
              <Button size="sm" variant="outline" onClick={() => handleGenerateReport("Lost Tools")}>
                <Download className="mr-1 h-4 w-4" /> Generate Report
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Total Lost Incidents" value={lostDelegations.length} icon={AlertTriangle} variant="destructive" />
              <StatCard title="Total Unresolved" value={lostDelegations.filter((d: any) => d.status === "Lost").length} icon={Ban} variant="destructive" />
              <StatCard title="Resolution Success" value="0%" icon={PackageCheck} variant="success" />
            </div>

            {lostToolsByStudent.length === 0 ? (
              <div className="rounded-lg border bg-card shadow-sm p-8 text-center text-muted-foreground">
                No lost tools reported yet.
              </div>
            ) : lostToolsByStudent.map(([studentId, data]) => (
              <div key={studentId} className="rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-4">
                  <div>
                    <h3 className="font-semibold">{data.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {studentId} • Class: {data.className} • {data.unresolvedCount} unresolved</p>
                  </div>
                  {data.unresolvedCount > 0 && (
                    <Button size="sm" variant="outline" onClick={() => handleSendPaymentReminder(studentId)}>
                      <Mail className="mr-1 h-3 w-3" /> Send Payment Reminder
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Date Issued</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tools.map((lt: any) => (
                        <TableRow key={lt.id} className="bg-destructive/5">
                          <TableCell className="font-medium">{lt.toolName}</TableCell>
                          <TableCell className="font-mono">{lt.quantity}</TableCell>
                          <TableCell className="text-sm">{lt.dateIssued}</TableCell>
                          <TableCell>
                            <StatusBadge status="Lost" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Class List Tab */}
          <TabsContent value="class-list" className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Class List
              </h2>
              <div className="flex gap-2">
                <Select value={reportClass} onValueChange={setReportClass}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => handleGenerateReport("Class List")}>
                  <Download className="mr-1 h-4 w-4" /> Generate Report
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lost Tools</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isLoading && classListData.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground/20" />
                      </TableCell>
                    </TableRow>
                  ) : classListData.map((s: any) => (
                    <TableRow key={s.studentId} className={cn(s.accountStatus === "Banned" && "bg-destructive/5")}>
                      <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.className}</TableCell>
                      <TableCell className="text-sm">{s.department}</TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell>
                        <span className={cn("font-mono font-bold", s.lostToolCount >= 5 ? "text-destructive" : s.lostToolCount > 0 ? "text-warning" : "text-muted-foreground")}>
                          {s.lostToolCount}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={s.accountStatus} /></TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && classListData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No students found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
