import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Lecturer } from "@/data/placeholderData";
import { GraduationCap, Plus, Trash2, Pencil, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";

const AdminLecturers = () => {
  const queryClient = useQueryClient();
  const { data: lecturers = [], isLoading } = useQuery({
    queryKey: ["lecturers"],
    queryFn: api.getLecturers,
  });

  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLecturer, setEditLecturer] = useState<Lecturer | null>(null);
  const [form, setForm] = useState({ name: "", department: "", email: "" });

  const createMutation = useMutation({
    mutationFn: api.createLecturer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer added");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(`Failed to add lecturer: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateLecturer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer updated");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(`Failed to update lecturer: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteLecturer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturers"] });
      toast.success("Lecturer(s) deleted");
      setSelected([]);
    },
    onError: (err: any) => toast.error(`Failed to delete lecturer: ${err.message}`),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openAdd = () => { setEditLecturer(null); setForm({ name: "", department: "", email: "" }); setModalOpen(true); };
  const openEdit = (t: Lecturer) => { setEditLecturer(t); setForm({ name: t.name, department: t.department, email: t.email || "" }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editLecturer) {
      updateMutation.mutate({ id: editLecturer.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = () => {
    if (selected.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selected.length} lecturer(s)?`)) {
      selected.forEach(id => deleteMutation.mutate(id));
    }
  };

  const filtered = lecturers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  const departments = [...new Set(lecturers.map(t => t.department))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Lecturers</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Lecturers" value={lecturers.length} icon={GraduationCap} />
          {departments.map(dept => (
            <StatCard key={dept} title={dept} value={lecturers.filter(t => t.department === dept).length} icon={GraduationCap} variant="success" />
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search lecturers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h3 className="text-sm font-semibold">{filtered.length} lecturers</h3>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isMutating}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.length})
                </Button>
              )}
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-1 h-4 w-4" /> Add Lecturer
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? filtered.map(t => t.id) : [])} className="rounded" />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading lecturers...</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No lecturers found.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(lecturer => (
                    <TableRow key={lecturer.id}>
                      <TableCell>
                        <input type="checkbox" checked={selected.includes(lecturer.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, lecturer.id] : prev.filter(id => id !== lecturer.id))} className="rounded" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{lecturer.id}</TableCell>
                      <TableCell className="font-medium">{lecturer.name}</TableCell>
                      <TableCell>{lecturer.department}</TableCell>
                      <TableCell className="text-sm">{lecturer.email || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(lecturer)} disabled={isMutating}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editLecturer ? "Edit Lecturer" : "Add Lecturer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Alice Mwangi" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Mechatronics" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. alice@school.ac.ke" type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isMutating}>Cancel</Button>
            <Button onClick={handleSave} disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editLecturer ? "Save" : "Add Lecturer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminLecturers;
