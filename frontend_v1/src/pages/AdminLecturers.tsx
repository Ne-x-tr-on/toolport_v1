import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Lecturer, initialLecturers } from "@/data/placeholderData";
import { GraduationCap, Plus, Trash2, Pencil, Search, Mail } from "lucide-react";
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
  const [lecturers, setLecturers] = useState<Lecturer[]>(initialLecturers);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLecturer, setEditLecturer] = useState<Lecturer | null>(null);
  const [form, setForm] = useState({ name: "", department: "", email: "" });

  const openAdd = () => { setEditLecturer(null); setForm({ name: "", department: "", email: "" }); setModalOpen(true); };
  const openEdit = (t: Lecturer) => { setEditLecturer(t); setForm({ name: t.name, department: t.department, email: t.email }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editLecturer) {
      setLecturers(prev => prev.map(t => t.id === editLecturer.id ? { ...t, ...form } : t));
      toast.success("Lecturer updated");
    } else {
      const newId = Math.max(0, ...lecturers.map(t => t.id)) + 1;
      setLecturers(prev => [...prev, { id: newId, ...form }]);
      toast.success("Lecturer added");
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setLecturers(prev => prev.filter(t => !selected.includes(t.id)));
    setSelected([]);
    toast.success("Lecturer(s) deleted");
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
                <Button variant="destructive" size="sm" onClick={handleDelete}>
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
                {filtered.map(lecturer => (
                  <TableRow key={lecturer.id}>
                    <TableCell>
                      <input type="checkbox" checked={selected.includes(lecturer.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, lecturer.id] : prev.filter(id => id !== lecturer.id))} className="rounded" />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{lecturer.id}</TableCell>
                    <TableCell className="font-medium">{lecturer.name}</TableCell>
                    <TableCell>{lecturer.department}</TableCell>
                    <TableCell className="text-sm">{lecturer.email || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(lecturer)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editLecturer ? "Save" : "Add Lecturer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminLecturers;
