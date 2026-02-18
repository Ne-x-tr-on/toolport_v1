import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import {
  Delegation, DelegationStatus, Tool, Student,
  initialDelegations, initialTools, initialLecturers, initialStudents, classOptions,
  computeToolStatus, departmentOptions, labOptions,
} from "@/data/placeholderData";
import {
  Send, RotateCcw, Plus, Search, ArrowUpDown, AlertTriangle,
  ClipboardList, Ban, Globe, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminDelegations = () => {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [delegations, setDelegations] = useState<Delegation[]>(initialDelegations);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Delegation>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Issue modal
  const [modalOpen, setModalOpen] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [issueQty, setIssueQty] = useState(1);
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [expectedReturnTime, setExpectedReturnTime] = useState("16:00");
  const [conditionBefore, setConditionBefore] = useState("Good");
  const [isInterDepartmental, setIsInterDepartmental] = useState(false);
  const [guestDepartment, setGuestDepartment] = useState("");
  const [guestLabProject, setGuestLabProject] = useState("");

  // Return modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnDelegationId, setReturnDelegationId] = useState<number | null>(null);
  const [conditionAfter, setConditionAfter] = useState("");
  const [markAsLost, setMarkAsLost] = useState(false);

  const matchedStudent = useMemo(() =>
    students.find(s => s.studentId.toLowerCase() === studentIdInput.trim().toLowerCase()),
    [studentIdInput, students]
  );

  const availableTools = useMemo(() =>
    tools.filter(t => t.quantity - t.issuedQty > 0),
    [tools]
  );

  const selectedTool = useMemo(() =>
    tools.find(t => t.id === parseInt(selectedToolId)),
    [tools, selectedToolId]
  );

  const handleIssue = () => {
    if (!studentIdInput.trim() || !selectedToolId || !selectedLecturerId) {
      toast.error("Please fill all required fields");
      return;
    }

    const student = students.find(s => s.studentId.toLowerCase() === studentIdInput.trim().toLowerCase());
    if (student && student.accountStatus === "Banned") {
      toast.error(`${student.name} is BANNED (${student.lostToolCount} lost tools). Cannot issue tools.`);
      return;
    }

    const tool = tools.find(t => t.id === parseInt(selectedToolId));
    if (!tool) return;
    const maxQty = tool.quantity - tool.issuedQty;
    if (issueQty > maxQty) {
      toast.error(`Only ${maxQty} available`);
      return;
    }

    if (isInterDepartmental && (!guestDepartment || !guestLabProject)) {
      toast.error("Inter-departmental borrowing requires department and lab/project info");
      return;
    }

    const lecturers = initialLecturers;
    const lecturer = lecturers.find(t => t.id === parseInt(selectedLecturerId));
    const studentName = matchedStudent?.name || studentIdInput;
    const studentClass = matchedStudent?.className || selectedClass;
    const now = new Date();

    const newDelegation: Delegation = {
      id: Math.max(0, ...delegations.map(d => d.id)) + 1,
      toolId: tool.id,
      toolName: tool.name,
      quantity: issueQty,
      lecturerId: lecturer?.id || 0,
      lecturerName: lecturer?.name || "",
      studentId: studentIdInput.trim(),
      studentName,
      className: studentClass,
      dateIssued: now.toISOString().slice(0, 10),
      expectedReturn: expectedReturn || "-",
      expectedReturnTime: expectedReturn ? expectedReturnTime : "-",
      dateReturned: "-",
      actualCheckoutTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      actualReturnTime: "-",
      status: "Issued",
      conditionBefore,
      conditionAfter: "",
      isInterDepartmental,
      guestDepartment: isInterDepartmental ? guestDepartment : undefined,
      guestLabProject: isInterDepartmental ? guestLabProject : undefined,
    };

    setDelegations(prev => [...prev, newDelegation]);
    setTools(prev => prev.map(t => {
      if (t.id !== tool.id) return t;
      const newIssued = t.issuedQty + issueQty;
      return { ...t, issuedQty: newIssued, status: computeToolStatus(t.quantity, newIssued, t.lowStockThreshold) };
    }));

    toast.success(`${issueQty} × ${tool.name} issued to ${studentName}`);
    setModalOpen(false);
    resetForm();
  };

  const openReturnModal = (id: number) => {
    setReturnDelegationId(id);
    setConditionAfter("");
    setMarkAsLost(false);
    setReturnModalOpen(true);
  };

  const handleReturn = () => {
    if (returnDelegationId === null) return;
    const del = delegations.find(d => d.id === returnDelegationId);
    if (!del) return;

    const now = new Date();
    const newStatus: DelegationStatus = markAsLost ? "Lost" : "Returned";

    setDelegations(prev => prev.map(d => d.id === returnDelegationId ? {
      ...d,
      status: newStatus,
      dateReturned: markAsLost ? "-" : now.toISOString().slice(0, 10),
      actualReturnTime: markAsLost ? "-" : `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      conditionAfter: conditionAfter || (markAsLost ? "Lost" : "Not specified"),
    } : d));

    if (!markAsLost) {
      setTools(prev => prev.map(t => {
        if (t.id !== del.toolId) return t;
        const newIssued = Math.max(0, t.issuedQty - del.quantity);
        return { ...t, issuedQty: newIssued, status: computeToolStatus(t.quantity, newIssued, t.lowStockThreshold) };
      }));
    }

    if (markAsLost) {
      setStudents(prev => prev.map(s => {
        if (s.studentId !== del.studentId) return s;
        const newLostCount = s.lostToolCount + 1;
        return {
          ...s,
          lostToolCount: newLostCount,
          accountStatus: newLostCount >= 5 ? "Banned" : s.accountStatus,
        };
      }));
      toast.warning(`${del.toolName} marked as LOST by ${del.studentName}`);
    } else {
      toast.success(`${del.toolName} returned by ${del.studentName}`);
    }

    setReturnModalOpen(false);
  };

  const handleSendReminder = (d: Delegation) => {
    const student = students.find(s => s.studentId === d.studentId);
    const email = student?.email || "unknown";
    toast.success(`📧 Email reminder sent to ${d.studentName} (${email}) about ${d.toolName}`);
  };

  const resetForm = () => {
    setStudentIdInput(""); setSelectedClass(""); setSelectedToolId("");
    setIssueQty(1); setSelectedLecturerId(""); setExpectedReturn("");
    setExpectedReturnTime("16:00"); setConditionBefore("Good");
    setIsInterDepartmental(false); setGuestDepartment(""); setGuestLabProject("");
  };

  const handleSort = (key: keyof Delegation) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let result = delegations;
    if (search) result = result.filter(d =>
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.toolName.toLowerCase().includes(search.toLowerCase()) ||
      d.studentId.toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus !== "all") result = result.filter(d => d.status === filterStatus);
    return [...result].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [delegations, search, filterStatus, sortKey, sortDir]);

  const issued = delegations.filter(d => d.status === "Issued").length;
  const overdue = delegations.filter(d => d.status === "Overdue").length;
  const returned = delegations.filter(d => d.status === "Returned").length;
  const lost = delegations.filter(d => d.status === "Lost").length;

  const isOverdue = (d: Delegation) => {
    if (d.status !== "Issued" || !d.expectedReturn || d.expectedReturn === "-") return false;
    return new Date(d.expectedReturn) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tool Delegations</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Delegations" value={delegations.length} icon={ClipboardList} />
          <StatCard title="Currently Issued" value={issued} icon={Send} variant="warning" />
          <StatCard title="Overdue" value={overdue} icon={AlertTriangle} variant="destructive" />
          <StatCard title="Returned" value={returned} icon={RotateCcw} variant="success" />
          <StatCard title="Lost" value={lost} icon={Ban} variant="destructive" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by student, tool, ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Issued">Issued</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Issue Tool
          </Button>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: "id" as const, label: "ID" },
                  { key: "toolName" as const, label: "Tool" },
                  { key: "quantity" as const, label: "Qty" },
                  { key: "lecturerName" as const, label: "Lecturer" },
                  { key: "studentId" as const, label: "Student ID" },
                  { key: "studentName" as const, label: "Student" },
                  { key: "dateIssued" as const, label: "Issued" },
                  { key: "expectedReturn" as const, label: "Due" },
                  { key: "conditionBefore" as const, label: "Cond. Before" },
                  { key: "conditionAfter" as const, label: "Cond. After" },
                  { key: "status" as const, label: "Status" },
                ].map(col => (
                  <TableHead key={col.key} className="cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">{col.label}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></div>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id} className={cn(
                  isOverdue(d) && "bg-destructive/5",
                  d.status === "Lost" && "bg-destructive/10",
                  d.isInterDepartmental && "border-l-2 border-l-primary"
                )}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{d.toolName}</div>
                    {d.isInterDepartmental && (
                      <span className="text-xs text-primary flex items-center gap-1"><Globe className="h-3 w-3" /> Inter-Dept</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{d.quantity}</TableCell>
                  <TableCell className="text-sm">{d.lecturerName}</TableCell>
                  <TableCell className="font-mono text-xs">{d.studentId}</TableCell>
                  <TableCell>{d.studentName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{d.dateIssued}</div>
                    <div className="text-xs text-muted-foreground">{d.actualCheckoutTime}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{d.expectedReturn}</div>
                    {d.expectedReturnTime !== "-" && <div className="text-xs text-muted-foreground">{d.expectedReturnTime}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{d.conditionBefore}</TableCell>
                  <TableCell className="text-xs">{d.conditionAfter || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={isOverdue(d) ? "Overdue" : d.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(d.status === "Issued" || d.status === "Overdue") && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openReturnModal(d.id)}>
                            <RotateCcw className="mr-1 h-3 w-3" /> Return
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleSendReminder(d)} title="Send email reminder">
                            <Mail className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {d.status === "Lost" && (
                        <Button size="sm" variant="ghost" onClick={() => handleSendReminder(d)} title="Send payment reminder">
                          <Mail className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                      {d.status === "Returned" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">No delegations found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Issue Tool Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Tool to Student</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Student ID</Label>
              <Input value={studentIdInput} onChange={e => setStudentIdInput(e.target.value)} placeholder="e.g. MEC/001/25 or DIM/0245/25" />
              {matchedStudent && (
                <div className={cn("mt-1.5 rounded-md border p-2 text-xs space-y-0.5",
                  matchedStudent.accountStatus === "Banned" ? "bg-destructive/10 border-destructive/30" : "bg-muted/30"
                )}>
                  <p><span className="font-medium">Name:</span> {matchedStudent.name}</p>
                  <p><span className="font-medium">Class:</span> {matchedStudent.className}</p>
                  <p><span className="font-medium">Dept:</span> {matchedStudent.department}</p>
                  <p><span className="font-medium">Units:</span> {matchedStudent.units.join(", ")}</p>
                  <p><span className="font-medium">Lost Tools:</span> {matchedStudent.lostToolCount}</p>
                  {matchedStudent.accountStatus === "Banned" && (
                    <p className="font-bold text-destructive">⚠ ACCOUNT BANNED — Cannot issue tools</p>
                  )}
                </div>
              )}
            </div>
            {!matchedStudent && (
              <div className="sm:col-span-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="sm:col-span-2">
              <Label>Tool / Component</Label>
              <Select value={selectedToolId} onValueChange={setSelectedToolId}>
                <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
                <SelectContent>
                  {availableTools.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.quantity - t.issuedQty} {t.unit} available) {t.isConsumable ? "🔄" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} max={selectedTool ? selectedTool.quantity - selectedTool.issuedQty : 1} value={issueQty} onChange={e => setIssueQty(parseInt(e.target.value) || 1)} />
              {selectedTool && <p className="text-xs text-muted-foreground mt-0.5">Max: {selectedTool.quantity - selectedTool.issuedQty} {selectedTool.isConsumable && "(consumable – qty decrements)"}</p>}
            </div>
            <div>
              <Label>Lecturer</Label>
              <Select value={selectedLecturerId} onValueChange={setSelectedLecturerId}>
                <SelectTrigger><SelectValue placeholder="Select lecturer" /></SelectTrigger>
                <SelectContent>
                  {initialLecturers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expected Return Date</Label>
              <Input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} />
            </div>
            <div>
              <Label>Return Time</Label>
              <Input type="time" value={expectedReturnTime} onChange={e => setExpectedReturnTime(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Condition Before Checkout</Label>
              <Input value={conditionBefore} onChange={e => setConditionBefore(e.target.value)} placeholder="e.g. Good, New, Minor scratches" />
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="interDept" checked={isInterDepartmental} onCheckedChange={(checked) => setIsInterDepartmental(checked === true)} />
                <Label htmlFor="interDept" className="text-sm font-normal">Inter-Departmental / Guest Borrowing</Label>
              </div>
              {isInterDepartmental && (
                <div className="grid gap-3 sm:grid-cols-2 rounded-md border p-3 bg-muted/20">
                  <div>
                    <Label>Tutor's Home Department</Label>
                    <Select value={guestDepartment} onValueChange={setGuestDepartment}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departmentOptions.filter(d => d !== "Mechatronics").map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lab / Project</Label>
                    <Input value={guestLabProject} onChange={e => setGuestLabProject(e.target.value)} placeholder="e.g. Power Electronics Lab" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleIssue}>Issue Tool</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return / Lost Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return / Report Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Condition After Return</Label>
              <Input value={conditionAfter} onChange={e => setConditionAfter(e.target.value)} placeholder="e.g. Good, Damaged tip, Scratched" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="markLost" checked={markAsLost} onCheckedChange={(checked) => setMarkAsLost(checked === true)} />
              <Label htmlFor="markLost" className="text-sm font-normal text-destructive">Mark as Lost (student will be charged)</Label>
            </div>
            {markAsLost && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                ⚠ This will increase the student's lost tool count. If they reach 5 lost tools, their account will be automatically banned.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnModalOpen(false)}>Cancel</Button>
            <Button variant={markAsLost ? "destructive" : "default"} onClick={handleReturn}>
              {markAsLost ? "Mark as Lost" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDelegations;
