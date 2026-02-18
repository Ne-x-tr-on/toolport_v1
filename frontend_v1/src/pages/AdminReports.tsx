import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  initialTools, initialDelegations, initialStudents, initialLostTools,
  categoryOptions, labOptions, classOptions,
} from "@/data/placeholderData";
import StatusBadge from "@/components/StatusBadge";
import {
  Package, PackageCheck, PackageX, AlertTriangle, TrendingUp, TrendingDown,
  Users, GraduationCap, Ban, FileText, Download, Mail,
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

  const tools = initialTools;
  const delegations = initialDelegations;
  const students = initialStudents;
  const lostTools = initialLostTools;

  const filteredTools = useMemo(() => {
    let result = tools;
    if (filterCategory !== "all") result = result.filter(t => t.category === filterCategory);
    if (filterLab !== "all") result = result.filter(t => t.lab === filterLab);
    return result;
  }, [tools, filterCategory, filterLab]);

  const totalQty = filteredTools.reduce((s, t) => s + t.quantity, 0);
  const issuedQty = filteredTools.reduce((s, t) => s + t.issuedQty, 0);
  const availableQty = totalQty - issuedQty;
  const outOfStockCount = filteredTools.filter(t => t.status === "Out of Stock").length;
  const overdueCount = delegations.filter(d => d.status === "Overdue").length;
  const lowStockCount = filteredTools.filter(t => t.status === "Low Stock").length;
  const lostCount = delegations.filter(d => d.status === "Lost").length;

  const statusData = [
    { name: "Available", count: filteredTools.filter(t => t.status === "Available").length },
    { name: "Partially Issued", count: filteredTools.filter(t => t.status === "Partially Issued").length },
    { name: "Low Stock", count: filteredTools.filter(t => t.status === "Low Stock").length },
    { name: "Out of Stock", count: filteredTools.filter(t => t.status === "Out of Stock").length },
  ];

  const categoryData = categoryOptions.map(cat => ({
    name: cat.replace("Electronic Component", "Electronics"),
    total: tools.filter(t => t.category === cat).reduce((s, t) => s + t.quantity, 0),
    issued: tools.filter(t => t.category === cat).reduce((s, t) => s + t.issuedQty, 0),
  }));

  const toolUsageMap: Record<string, number> = {};
  delegations.forEach(d => { toolUsageMap[d.toolName] = (toolUsageMap[d.toolName] || 0) + d.quantity; });
  const mostUsed = Object.entries(toolUsageMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

  const classUsage: Record<string, number> = {};
  delegations.forEach(d => { classUsage[d.className] = (classUsage[d.className] || 0) + d.quantity; });
  const classData = Object.entries(classUsage).map(([name, count]) => ({ name, count }));

  const lecturerUsage: Record<string, number> = {};
  delegations.forEach(d => { lecturerUsage[d.lecturerName] = (lecturerUsage[d.lecturerName] || 0) + d.quantity; });
  const lecturerData = Object.entries(lecturerUsage).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name: name.split(" ").slice(-1)[0], count, fullName: name }));

  const monthlyData: { month: string; issued: number; returned: number; lost: number }[] = [];


  // Lost tools report
  const lostToolsByStudent = useMemo(() => {
    const map: Record<string, { name: string, className: string, tools: typeof lostTools, unresolvedCount: number }> = {};
    lostTools.forEach(lt => {
      const student = students.find(s => s.studentId === lt.studentId);
      if (!map[lt.studentId]) {
        map[lt.studentId] = {
          name: student?.name || lt.studentId,
          className: student?.className || "",
          tools: [],
          unresolvedCount: 0,
        };
      }
      map[lt.studentId].tools.push(lt);
      if (!lt.resolved) map[lt.studentId].unresolvedCount++;
    });
    return Object.entries(map).sort((a, b) => b[1].unresolvedCount - a[1].unresolvedCount);
  }, [lostTools, students]);

  // Class list report
  const classListData = useMemo(() => {
    const filtered = reportClass === "all" ? students : students.filter(s => s.className === reportClass);
    return filtered;
  }, [students, reportClass]);

  const handleSendPaymentReminder = (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    toast.success(`📧 Payment reminder sent to ${student?.name} (${student?.email})`);
  };

  const handleGenerateReport = (reportType: string) => {
    toast.success(`📄 ${reportType} report generated and ready for download`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics & Reports</h1>

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
              <StatCard title="Total Items" value={totalQty} icon={Package} />
              <StatCard title="Available" value={availableQty} icon={PackageCheck} variant="success" />
              <StatCard title="Issued" value={issuedQty} icon={PackageX} variant="warning" />
              <StatCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} variant="warning" />
              <StatCard title="Out of Stock" value={outOfStockCount} icon={PackageX} variant="destructive" />
              <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} variant="destructive" />
              <StatCard title="Lost" value={lostCount} icon={Ban} variant="destructive" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Tool Status Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">Usage Trend (Monthly)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="issued" stroke={COLORS[0]} strokeWidth={2} name="Issued" />
                    <Line type="monotone" dataKey="returned" stroke={COLORS[1]} strokeWidth={2} name="Returned" />
                    <Line type="monotone" dataKey="lost" stroke={COLORS[3]} strokeWidth={2} name="Lost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Most Used Tools</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mostUsed} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Qty Issued" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold">By Category (Total vs Issued)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
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
                  <BarChart data={classData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS[4]} name="Qty Issued" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Usage by Lecturer</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={lecturerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
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
              <StatCard title="Total Lost" value={lostTools.length} icon={AlertTriangle} variant="destructive" />
              <StatCard title="Unresolved" value={lostTools.filter(lt => !lt.resolved).length} icon={Ban} variant="destructive" />
              <StatCard title="Resolved" value={lostTools.filter(lt => lt.resolved).length} icon={PackageCheck} variant="success" />
            </div>

            {lostToolsByStudent.map(([studentId, data]) => (
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
                        <TableHead>Date Lost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resolution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.tools.map(lt => (
                        <TableRow key={lt.delegationId} className={cn(!lt.resolved && "bg-destructive/5")}>
                          <TableCell className="font-medium">{lt.toolName}</TableCell>
                          <TableCell className="font-mono">{lt.quantity}</TableCell>
                          <TableCell className="text-sm">{lt.dateLost}</TableCell>
                          <TableCell>
                            {lt.resolved ? <StatusBadge status={lt.resolution || "Recovered"} /> : <StatusBadge status="Lost" />}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {lt.resolved ? `${lt.resolution}${lt.receiptUploaded === false ? " (receipt pending)" : ""}` : "Pending"}
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

            <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lost Tools</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classListData.map(s => (
                    <TableRow key={s.studentId} className={cn(s.accountStatus === "Banned" && "bg-destructive/5")}>
                      <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.className}</TableCell>
                      <TableCell className="text-sm">{s.department}</TableCell>
                      <TableCell className="text-xs max-w-[200px]">
                        {s.units.map(u => (
                          <span key={u} className="inline-block rounded bg-muted px-1.5 py-0.5 mr-1 mb-1">{u}</span>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell>
                        <span className={cn("font-mono font-bold", s.lostToolCount >= 5 ? "text-destructive" : s.lostToolCount > 0 ? "text-warning" : "text-muted-foreground")}>
                          {s.lostToolCount}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={s.accountStatus} /></TableCell>
                    </TableRow>
                  ))}
                  {classListData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No students found.</TableCell>
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
