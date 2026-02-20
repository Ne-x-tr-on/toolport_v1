import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Lab } from "@/data/placeholderData";
import { FlaskConical, Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
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
  const queryClient = useQueryClient();
  const { data: labs = [], isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: api.getLabs,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editLab, setEditLab] = useState<Lab | null>(null);
  const [form, setForm] = useState({ name: "", location: "", department: "Mechatronics", description: "" });

  const createMutation = useMutation({
    mutationFn: api.createLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Lab created");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(`Failed to create lab: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.updateLab(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Lab updated");
      setModalOpen(false);
    },
    onError: (err: any) => toast.error(`Failed to update lab: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteLab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Lab deleted");
    },
    onError: (err: any) => toast.error(`Failed to delete lab: ${err.message}`),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openAdd = () => { setEditLab(null); setForm({ name: "", location: "", department: "Mechatronics", description: "" }); setModalOpen(true); };
  const openEdit = (l: Lab) => { setEditLab(l); setForm({ name: l.name, location: l.location || "", department: l.department, description: l.description || "" }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Lab name is required"); return; }
    if (editLab) {
      updateMutation.mutate({ id: editLab.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lab?")) {
      deleteMutation.mutate(id);
    }
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading labs...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No labs found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(lab => (
                  <TableRow key={lab.id}>
                    <TableCell className="font-mono text-xs">{lab.id}</TableCell>
                    <TableCell className="font-medium">{lab.name}</TableCell>
                    <TableCell className="text-sm">{lab.location}</TableCell>
                    <TableCell className="text-sm">{lab.department}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{lab.description}</TableCell>
                    <TableCell className="font-mono">{lab.toolCount || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(lab)} disabled={isMutating}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(lab.id)} disabled={isMutating}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isMutating}>Cancel</Button>
            <Button onClick={handleSave} disabled={isMutating}>
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editLab ? "Save" : "Add Lab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminLabs;
