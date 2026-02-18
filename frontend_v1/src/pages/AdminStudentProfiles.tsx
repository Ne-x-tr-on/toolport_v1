import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";   // 👈 new import
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import {
  Student, Delegation, LostToolRecord,
  initialStudents, initialDelegations, initialLostTools,
} from "@/data/placeholderData";
import {
  Users, Search, Ban, ShieldCheck, Eye,
  CheckCircle, DollarSign, Package, AlertTriangle, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const AdminStudentProfiles = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [delegations, setDelegations] = useState<Delegation[]>(initialDelegations);
  const [lostTools, setLostTools] = useState<LostToolRecord[]>(initialLostTools);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 👇 NEW: state for add student dialog and form
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    studentId: "",
    name: "",
    className: "",
    department: "",
    units: [],
    email: "",
    accountStatus: "Active",
    lostToolCount: 0,
  });

  // 👇 NEW: read URL query param to open dialog automatically
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddDialogOpen(true);
      // Remove the query param so refresh doesn't reopen
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    let result = students;
    if (search) result = result.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus !== "all") result = result.filter(s => s.accountStatus === filterStatus);
    return result;
  }, [students, search, filterStatus]);

  const selectedStudent = students.find(s => s.studentId === selectedStudentId);
  const studentDelegations = useMemo(() =>
    delegations.filter(d => d.studentId === selectedStudentId),
    [delegations, selectedStudentId]
  );
  const studentLostTools = useMemo(() =>
    lostTools.filter(lt => lt.studentId === selectedStudentId),
    [lostTools, selectedStudentId]
  );
  const currentHoldings = studentDelegations.filter(d => d.status === "Issued" || d.status === "Overdue");
  const history = studentDelegations.filter(d => d.status === "Returned" || d.status === "Lost");

  const handleRecover = (delegationId: number) => {
    setLostTools(prev => prev.map(lt =>
      lt.delegationId === delegationId ? { ...lt, resolved: true, resolution: "Recovered" } : lt
    ));
    const lt = lostTools.find(l => l.delegationId === delegationId);
    if (lt) {
      setStudents(prev => prev.map(s => {
        if (s.studentId !== lt.studentId) return s;
        const newCount = Math.max(0, s.lostToolCount - 1);
        return { ...s, lostToolCount: newCount, accountStatus: newCount < 5 ? "Active" : s.accountStatus };
      }));
    }
    toast.success("Tool marked as recovered");
  };

  const handlePaid = (delegationId: number) => {
    setLostTools(prev => prev.map(lt =>
      lt.delegationId === delegationId ? { ...lt, resolved: true, resolution: "Paid", receiptUploaded: false } : lt
    ));
    const lt = lostTools.find(l => l.delegationId === delegationId);
    if (lt) {
      setStudents(prev => prev.map(s => {
        if (s.studentId !== lt.studentId) return s;
        const newCount = Math.max(0, s.lostToolCount - 1);
        return { ...s, lostToolCount: newCount, accountStatus: newCount < 5 ? "Active" : s.accountStatus };
      }));
    }
    toast.success("Tool marked as paid. Remember to upload receipt.");
  };

  const handleSendReminder = (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    toast.success(`📧 Payment/return reminder sent to ${student?.name} (${student?.email})`);
  };

  const bannedCount = students.filter(s => s.accountStatus === "Banned").length;
  const activeCount = students.filter(s => s.accountStatus === "Active").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Student Profiles</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={students.length} icon={Users} />
          <StatCard title="Active" value={activeCount} icon={ShieldCheck} variant="success" />
          <StatCard title="Banned" value={bannedCount} icon={Ban} variant="destructive" />
          <StatCard title="Total Lost Tools" value={lostTools.filter(lt => !lt.resolved).length} icon={AlertTriangle} variant="warning" />
        </div>

        {/* 👇 NEW: added "Add Student" button next to search/filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, ID, or class..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" /> Add Student
          </Button>
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
                <TableHead>Lost Tools</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.studentId} className={cn(s.accountStatus === "Banned" && "bg-destructive/5")}>
                  <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm">{s.className}</TableCell>
                  <TableCell className="text-sm">{s.department}</TableCell>
                  <TableCell className="text-xs max-w-[180px]">
                    {s.units.map(u => (
                      <span key={u} className="inline-block rounded bg-muted px-1.5 py-0.5 mr-1 mb-1">{u}</span>
                    ))}
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-mono font-bold", s.lostToolCount >= 5 ? "text-destructive" : s.lostToolCount > 0 ? "text-warning" : "text-muted-foreground")}>
                      {s.lostToolCount}
                    </span>
                    {s.lostToolCount >= 5 && <span className="ml-1 text-xs text-destructive">(auto-ban)</span>}
                  </TableCell>
                  <TableCell><StatusBadge status={s.accountStatus} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedStudentId(s.studentId)}>
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleSendReminder(s.studentId)} title="Send reminder email">
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 👇 NEW: Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // validation
              if (!newStudent.studentId || !newStudent.name || !newStudent.className || !newStudent.department || !newStudent.email) {
                toast.error("Please fill in all required fields");
                return;
              }
              // check duplicate studentId
              if (students.some(s => s.studentId === newStudent.studentId)) {
                toast.error("Student ID already exists");
                return;
              }
              // create full student object
              const studentToAdd: Student = {
                studentId: newStudent.studentId,
                name: newStudent.name,
                className: newStudent.className,
                department: newStudent.department,
                units: newStudent.units || [],
                email: newStudent.email,
                accountStatus: newStudent.accountStatus || "Active",
                lostToolCount: 0,
              };
              setStudents(prev => [...prev, studentToAdd]);
              toast.success(`Student ${studentToAdd.name} added`);
              setIsAddDialogOpen(false);
              setNewStudent({
                studentId: "",
                name: "",
                className: "",
                department: "",
                units: [],
                email: "",
                accountStatus: "Active",
                lostToolCount: 0,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Student ID *</label>
                <Input
                  value={newStudent.studentId}
                  onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  placeholder="e.g. STU001"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Class *</label>
                <Input
                  value={newStudent.className}
                  onChange={e => setNewStudent({ ...newStudent, className: e.target.value })}
                  placeholder="e.g. CS101"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <Input
                  value={newStudent.department}
                  onChange={e => setNewStudent({ ...newStudent, department: e.target.value })}
                  placeholder="Computer Science"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newStudent.email}
                onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                placeholder="john@university.edu"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Units (comma‑separated)</label>
              <Input
                value={newStudent.units?.join(", ")}
                onChange={e => setNewStudent({
                  ...newStudent,
                  units: e.target.value.split(",").map(u => u.trim()).filter(Boolean)
                })}
                placeholder="MATH101, PHYS201"
              />
              <p className="text-xs text-muted-foreground">Separate unit codes with commas</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Account Status</label>
              <Select
                value={newStudent.accountStatus}
                onValueChange={(value: "Active" | "Banned") => setNewStudent({ ...newStudent, accountStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Student</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Student Profile Modal (unchanged) */}
      <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Student Profile
              {selectedStudent?.accountStatus === "Banned" && <StatusBadge status="Banned" />}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedStudent.name}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Student ID</p>
                  <p className="font-mono font-medium">{selectedStudent.studentId}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedStudent.className}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground mb-1">Units</p>
                <div className="flex flex-wrap gap-1">
                  {selectedStudent.units.map(u => (
                    <span key={u} className="inline-block rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">{u}</span>
                  ))}
                </div>
              </div>

              {selectedStudent.accountStatus === "Banned" && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-semibold text-destructive flex items-center gap-2"><Ban className="h-4 w-4" /> Account Banned</p>
                  <p className="text-sm text-muted-foreground mt-1">This student has {selectedStudent.lostToolCount} lost tools (threshold: 5). They cannot checkout new tools until lost items are recovered or paid for.</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Package className="h-4 w-4" /> Current Holdings ({currentHoldings.length})</h4>
                {currentHoldings.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Date Issued</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentHoldings.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.toolName}</TableCell>
                            <TableCell className="font-mono">{d.quantity}</TableCell>
                            <TableCell className="text-sm">{d.dateIssued}</TableCell>
                            <TableCell className="text-sm">{d.expectedReturn}</TableCell>
                            <TableCell><StatusBadge status={d.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No tools currently held.</p>}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Tool History ({history.length})</h4>
                {history.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Issued</TableHead>
                          <TableHead>Returned</TableHead>
                          <TableHead>Cond. Before</TableHead>
                          <TableHead>Cond. After</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map(d => (
                          <TableRow key={d.id} className={cn(d.status === "Lost" && "bg-destructive/5")}>
                            <TableCell className="font-medium">{d.toolName}</TableCell>
                            <TableCell className="font-mono">{d.quantity}</TableCell>
                            <TableCell className="text-sm">{d.dateIssued}</TableCell>
                            <TableCell className="text-sm">{d.dateReturned}</TableCell>
                            <TableCell className="text-xs">{d.conditionBefore}</TableCell>
                            <TableCell className="text-xs">{d.conditionAfter || "—"}</TableCell>
                            <TableCell><StatusBadge status={d.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-sm text-muted-foreground">No history yet.</p>}
              </div>

              {studentLostTools.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Lost Tools & Financials ({studentLostTools.filter(lt => !lt.resolved).length} unresolved)
                  </h4>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Date Lost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentLostTools.map(lt => (
                          <TableRow key={lt.delegationId} className={cn(!lt.resolved && "bg-destructive/5")}>
                            <TableCell className="font-medium">{lt.toolName}</TableCell>
                            <TableCell className="font-mono">{lt.quantity}</TableCell>
                            <TableCell className="text-sm">{lt.dateLost}</TableCell>
                            <TableCell>
                              {lt.resolved ? <StatusBadge status={lt.resolution || "Recovered"} /> : <StatusBadge status="Lost" />}
                            </TableCell>
                            <TableCell>
                              {!lt.resolved ? (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => handleRecover(lt.delegationId)}>
                                    <CheckCircle className="mr-1 h-3 w-3" /> Recovered
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handlePaid(lt.delegationId)}>
                                    <DollarSign className="mr-1 h-3 w-3" /> Paid
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {lt.resolution} {lt.receiptUploaded === false && "(receipt pending)"}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminStudentProfiles;