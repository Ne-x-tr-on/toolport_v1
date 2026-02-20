import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import {
  Delegation, Tool, Student, Lecturer, DelegationStatus, ConditionGrade,
  classOptions, departmentOptions,
} from "@/data/placeholderData";
import {
  Send, RotateCcw, Plus, Search, ArrowUpDown, AlertTriangle,
  ClipboardList, Ban, Globe, Mail, Loader2,
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
  const queryClient = useQueryClient();

  const { data: delegationsResponse, isLoading: delegationsLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: api.getDelegations,
  });
  const delegations = (delegationsResponse as any)?.data || [];

  const { data: toolsResponse } = useQuery({
    queryKey: ["tools"],
    queryFn: api.getTools,
  });
  const tools = (toolsResponse as any) || [];

  const { data: studentsResponse } = useQuery({
    queryKey: ["students"],
    queryFn: api.getStudents,
  });
  const students = (studentsResponse as any)?.data || [];

  const { data: lecturersResponse } = useQuery({
    queryKey: ["lecturers"],
    queryFn: api.getLecturers,
  });
  const lecturers = (lecturersResponse as any) || [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Issue modal
  const [modalOpen, setModalOpen] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
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
  const [conditionAfter, setConditionAfter] = useState("Good");
  const [markAsLost, setMarkAsLost] = useState(false);

  const resetForm = () => {
    setStudentIdInput(""); setSelectedToolId("");
    setIssueQty(1); setSelectedLecturerId(""); setExpectedReturn("");
    setExpectedReturnTime("16:00"); setConditionBefore("Good");
    setIsInterDepartmental(false); setGuestDepartment(""); setGuestLabProject("");
  };

  const issueMutation = useMutation({
    mutationFn: api.createDelegation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool issued successfully");
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Failed to issue: ${err.message}`),
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.returnDelegation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Tool return processed");
      setReturnModalOpen(false);
    },
    onError: (err: any) => toast.error(`Failed to return: ${err.message}`),
  });

  const matchedStudent = useMemo(() =>
    students.find((s: Student) => s.studentId.toLowerCase() === studentIdInput.trim().toLowerCase()),
    [studentIdInput, students]
  );

  const availableTools = useMemo(() =>
    tools.filter((t: Tool) => t.quantity - t.issuedQty > 0),
    [tools]
  );

  const selectedTool = useMemo(() =>
    tools.find((t: Tool) => t.id === parseInt(selectedToolId)),
    [tools, selectedToolId]
  );

  const handleIssue = () => {
    if (!studentIdInput.trim() || !selectedToolId || !selectedLecturerId || !expectedReturn) {
      toast.error("Please fill all required fields");
      return;
    }

    if (matchedStudent && matchedStudent.accountStatus === "Banned") {
      toast.error(`${matchedStudent.name} is BANNED. Cannot issue tools.`);
      return;
    }

    issueMutation.mutate({
      tool_id: parseInt(selectedToolId),
      quantity: issueQty,
      lecturer_id: parseInt(selectedLecturerId),
      student_id: studentIdInput.trim().toUpperCase(),
      expected_return: expectedReturn,
      expected_return_time: expectedReturnTime ? `${expectedReturnTime}:00` : null,
      condition_before: conditionBefore as ConditionGrade,
      is_inter_departmental: isInterDepartmental,
      guest_department: isInterDepartmental ? guestDepartment : null,
      guest_lab_project: isInterDepartmental ? guestLabProject : null,
    });
  };

  const openReturnModal = (id: number) => {
    setReturnDelegationId(id);
    setConditionAfter("Good");
    setMarkAsLost(false);
    setReturnModalOpen(true);
  };

  const handleReturnAction = () => {
    if (returnDelegationId === null) return;
    returnMutation.mutate({
      id: returnDelegationId,
      data: {
        condition_after: conditionAfter as ConditionGrade,
        mark_as_lost: markAsLost,
      },
    });
  };

  const handleSendReminder = (d: any) => {
    const student = students.find((s: Student) => s.studentId === d.studentId);
    const email = student?.email || "unknown";
    toast.success(`📧 Email reminder sent to ${d.studentName} (${email}) about ${d.toolName}`);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const isOverdue = (d: Delegation) => {
    if (d.status !== "Issued" || !d.expectedReturn || d.expectedReturn === "-") return false;
    return new Date(d.expectedReturn) < new Date();
  };

  const filtered = useMemo(() => {
    let result = delegations;
    if (search) result = result.filter((d: Delegation) =>
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.toolName.toLowerCase().includes(search.toLowerCase()) ||
      d.studentId.toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus !== "all") result = result.filter((d: Delegation) => d.status === filterStatus);
    return [...result].sort((a: any, b: any) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [delegations, search, filterStatus, sortKey, sortDir]);

  const issued = delegations.filter((d: Delegation) => d.status === "Issued").length;
  const overdue = delegations.filter((d: Delegation) => d.status === "Overdue" || isOverdue(d)).length;
  const returnedCount = delegations.filter((d: Delegation) => d.status === "Returned").length;
  const lost = delegations.filter((d: Delegation) => d.status === "Lost").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tool Delegations</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Delegations" value={delegations.length} icon={ClipboardList} />
          <StatCard title="Currently Issued" value={issued} icon={Send} variant="warning" />
          <StatCard title="Overdue" value={overdue} icon={AlertTriangle} variant="destructive" />
          <StatCard title="Returned" value={returnedCount} icon={RotateCcw} variant="success" />
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
                  { key: "id", label: "ID" },
                  { key: "toolName", label: "Tool" },
                  { key: "quantity", label: "Qty" },
                  { key: "lecturerName", label: "Lecturer" },
                  { key: "studentId", label: "Student ID" },
                  { key: "studentName", label: "Student" },
                  { key: "dateIssued", label: "Issued" },
                  { key: "expectedReturn", label: "Due" },
                  { key: "conditionBefore", label: "Cond. Before" },
                  { key: "conditionAfter", label: "Cond. After" },
                  { key: "status", label: "Status" },
                ].map(col => (
                  <TableHead key={col.key} className="cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">{col.label}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></div>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delegationsLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading delegations...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">No delegations found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((d: Delegation) => (
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
                      {d.expectedReturnTime && d.expectedReturnTime !== "-" && <div className="text-xs text-muted-foreground">{d.expectedReturnTime}</div>}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
                  <p><span className="font-medium">Lost Tools:</span> {matchedStudent.lostToolCount}</p>
                  {matchedStudent.accountStatus === "Banned" && (
                    <p className="font-bold text-destructive">⚠ ACCOUNT BANNED — Cannot issue tools</p>
                  )}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>Tool / Component</Label>
              <Select value={selectedToolId} onValueChange={setSelectedToolId}>
                <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
                <SelectContent>
                  {availableTools.map((t: any) => (
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
                  {lecturers.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
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
              <Select value={conditionBefore} onValueChange={setConditionBefore}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleIssue} disabled={issueMutation.isPending}>
              {issueMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Tool
            </Button>
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
              <Select value={conditionAfter} onValueChange={setConditionAfter}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
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
            <Button
              variant={markAsLost ? "destructive" : "default"}
              onClick={handleReturnAction}
              disabled={returnMutation.isPending}
            >
              {returnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {markAsLost ? "Mark as Lost" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDelegations;
