import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Lab, initialLabs } from "@/data/placeholderData";
import { FlaskConical, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";

const AdminLabs = () => {
  const [labs, setLabs] = useState<Lab[]>(initialLabs);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLab, setEditLab] = useState<Lab | null>(null);
  const [form, setForm] = useState({ name: "", location: "", department: "Mechatronics", description: "" });

  const openAdd = () => { setEditLab(null); setForm({ name: "", location: "", department: "Mechatronics", description: "" }); setModalOpen(true); };
  const openEdit = (l: Lab) => { setEditLab(l); setForm({ name: l.name, location: l.location, department: l.department, description: l.description }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Lab name is required"); return; }
    if (editLab) {
      setLabs(prev => prev.map(l => l.id === editLab.id ? { ...l, ...form } : l));
      toast.success("Lab updated");
    } else {
      const newId = Math.max(0, ...labs.map(l => l.id)) + 1;
      setLabs(prev => [...prev, { id: newId, ...form, toolCount: 0 }]);
      toast.success("Lab created");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    setLabs(prev => prev.filter(l => l.id !== id));
    toast.success("Lab deleted");
  };

  const filtered = labs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Lab Management</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Labs" value={labs.length} icon={FlaskConical} />
          <StatCard title="Mechatronics Dept" value={labs.filter(l => l.department === "Mechatronics").length} icon={FlaskConical} variant="success" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search labs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" /> Add Lab
          </Button>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(lab => (
                <TableRow key={lab.id}>
                  <TableCell className="font-mono text-xs">{lab.id}</TableCell>
                  <TableCell className="font-medium">{lab.name}</TableCell>
                  <TableCell className="text-sm">{lab.location}</TableCell>
                  <TableCell className="text-sm">{lab.department}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{lab.description}</TableCell>
                  <TableCell className="font-mono">{lab.toolCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(lab)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(lab.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No labs found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Departmental Restriction:</strong> This system defaults to the Mechatronics Department. Labs from other departments can be added for inter-departmental tool borrowing purposes.
          </p>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editLab ? "Edit Lab" : "Add New Lab"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lab Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mechatronics Lab" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Block A, Room 101" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Mechatronics" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Lab description..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editLab ? "Save" : "Add Lab"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminLabs;
