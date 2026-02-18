import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import {
  Tool, ToolCategory, ToolSubcategory, ToolUnit, ToolStatus,
  initialTools, categoryOptions, subcategoryMap, labOptions, unitOptions,
  computeToolStatus,
} from "@/data/placeholderData";
import {
  Package, Plus, Trash2, ArrowUpDown, Search, Pencil, AlertTriangle, X,
} from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Extended Tool type for form
type ExtendedTool = Tool & {
  value?: string;
  storageType?: string;
  positionCode?: string;
  trackMultipleLocations?: boolean;
  storageLocations?: Array<{ location: string; quantity: number }>;
};

type StorageLocation = { location: string; quantity: number };

const emptyTool = (): Partial<ExtendedTool> => ({
  name: "", category: "Hand Tool", subcategory: "Other", quantity: 1, issuedQty: 0,
  unit: "pcs", lab: "Mechatronics Lab", description: "", dateAdded: new Date().toISOString().slice(0, 10),
  status: "Available", lowStockThreshold: 5, isConsumable: false, consumableType: "",
  value: "", storageType: "shelf", positionCode: "", trackMultipleLocations: false, storageLocations: [],
});

const consumableTypeOptions = [
  "electronic component",
  "mechanical part",
  "chemical",
  "packaging",
  "other"
];

const storageTypeOptions = [
  "drawer",
  "shelf",
  "vending slot",
  "cabinet",
  "box"
];

const AdminTools = () => {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSubcategory, setFilterSubcategory] = useState<string>("all");
  const [filterLab, setFilterLab] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Tool>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTool, setEditTool] = useState<Partial<ExtendedTool> | null>(null);
  const [form, setForm] = useState<Partial<ExtendedTool>>(emptyTool());

  // State for searchable dropdowns
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearchOpen, setSubcategorySearchOpen] = useState(false);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customSubcategories, setCustomSubcategories] = useState<Record<string, string[]>>({});

  const openAdd = () => { setEditTool(null); setForm(emptyTool()); setModalOpen(true); };
  const openEdit = (t: Tool) => { 
    setEditTool(t); 
    setForm({ ...t }); 
    setModalOpen(true); 
  };

  const handleSave = () => {
    if (!form.name?.trim()) return;
    const status = computeToolStatus(form.quantity || 0, form.issuedQty || 0, form.lowStockThreshold || 5);
    if (editTool) {
      setTools(prev => prev.map(t => t.id === editTool.id ? { ...t, ...form, status } as Tool : t));
    } else {
      const newId = Math.max(0, ...tools.map(t => t.id)) + 1;
      setTools(prev => [...prev, { ...form, id: newId, status } as Tool]);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setTools(prev => prev.filter(t => !selected.includes(t.id)));
    setSelected([]);
  };

  const handleSort = (key: keyof Tool) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const allCategories = [...categoryOptions, ...customCategories];
  const subcategories = filterCategory !== "all" ? [
    ...(subcategoryMap[filterCategory as ToolCategory] || []),
    ...(customSubcategories[filterCategory] || [])
  ] : [];

  const formSubcategories = form.category ? [
    ...(subcategoryMap[form.category as ToolCategory] || []),
    ...(customSubcategories[form.category] || [])
  ] : [];

  const filteredCategories = allCategories.filter(c => 
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredSubcategories = formSubcategories.filter(s =>
    s.toLowerCase().includes(subcategorySearch.toLowerCase())
  );

  const handleAddCategory = () => {
    if (categorySearch.trim() && !allCategories.includes(categorySearch.trim())) {
      setCustomCategories(prev => [...prev, categorySearch.trim()]);
      setForm(f => ({ ...f, category: categorySearch.trim() as ToolCategory, subcategory: "Other" }));
      setCategorySearch("");
      setCategorySearchOpen(false);
    }
  };

  const handleAddSubcategory = () => {
    if (subcategorySearch.trim() && form.category && !formSubcategories.includes(subcategorySearch.trim())) {
      setCustomSubcategories(prev => ({
        ...prev,
        [form.category!]: [...(prev[form.category!] || []), subcategorySearch.trim()]
      }));
      setForm(f => ({ ...f, subcategory: subcategorySearch.trim() as ToolSubcategory }));
      setSubcategorySearch("");
      setSubcategorySearchOpen(false);
    }
  };

  const addStorageLocation = () => {
    const locations = form.storageLocations || [];
    setForm(f => ({ 
      ...f, 
      storageLocations: [...locations, { location: "", quantity: 0 }]
    }));
  };

  const removeStorageLocation = (index: number) => {
    setForm(f => ({
      ...f,
      storageLocations: (f.storageLocations || []).filter((_, i) => i !== index)
    }));
  };

  const updateStorageLocation = (index: number, field: keyof StorageLocation, value: string | number) => {
    setForm(f => ({
      ...f,
      storageLocations: (f.storageLocations || []).map((loc, i) => 
        i === index ? { ...loc, [field]: value } : loc
      )
    }));
  };

  const filtered = useMemo(() => {
    let result = tools;
    if (search) result = result.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory !== "all") result = result.filter(t => t.category === filterCategory);
    if (filterSubcategory !== "all") result = result.filter(t => t.subcategory === filterSubcategory);
    if (filterLab !== "all") result = result.filter(t => t.lab === filterLab);
    if (filterStatus !== "all") result = result.filter(t => t.status === filterStatus);
    return [...result].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tools, search, filterCategory, filterSubcategory, filterLab, filterStatus, sortKey, sortDir]);

  const columns: { key: keyof Tool; label: string }[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "subcategory", label: "Subcategory" },
    { key: "quantity", label: "Total Qty" },
    { key: "issuedQty", label: "Issued" },
    { key: "unit", label: "Unit" },
    { key: "lab", label: "Lab" },
    { key: "status", label: "Status" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tools & Products</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setFilterSubcategory("all"); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterCategory !== "all" && (
            <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Subcategory" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterLab} onValueChange={setFilterLab}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Lab" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labs</SelectItem>
              {labOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Partially Issued">Partially Issued</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h3 className="text-sm font-semibold">{filtered.length} tools/products</h3>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete ({selected.length})
                </Button>
              )}
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-1 h-4 w-4" /> Add Tool
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
                  {columns.map(col => (
                    <TableHead key={col.key} className="cursor-pointer select-none" onClick={() => handleSort(col.key)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tool => {
                  const availableQty = tool.quantity - tool.issuedQty;
                  const isLow = tool.status === "Low Stock";
                  return (
                    <TableRow key={tool.id} className={cn(
                      tool.status === "Out of Stock" && "bg-destructive/5",
                      isLow && "bg-warning/5"
                    )}>
                      <TableCell>
                        <input type="checkbox" checked={selected.includes(tool.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, tool.id] : prev.filter(id => id !== tool.id))} className="rounded" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tool.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{tool.name}</div>
                        {tool.isConsumable && <span className="text-xs text-primary">🔄 Consumable</span>}
                        {tool.consumableType && <span className="text-xs text-muted-foreground ml-1">({tool.consumableType})</span>}
                        {tool.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{tool.description}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{tool.category}</TableCell>
                      <TableCell className="text-sm">{tool.subcategory}</TableCell>
                      <TableCell className="font-mono text-sm">{tool.quantity}</TableCell>
                      <TableCell className="font-mono text-sm">{tool.issuedQty}</TableCell>
                      <TableCell className="text-sm">{tool.unit}</TableCell>
                      <TableCell className="text-sm">{tool.lab}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StatusBadge status={tool.status} />
                          {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(tool)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} className="py-8 text-center text-muted-foreground">
                      No tools match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTool ? "Edit Tool" : "Add New Tool"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Name *</Label>
                  <Input 
                    value={form.name || ""} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    placeholder="e.g. Soldering Kit, Resistor, Wire Stripper" 
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <Label>Value / Specification</Label>
                  <Input 
                    value={form.value || ""} 
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))} 
                    placeholder="e.g. 10kΩ, M4, 12V, 5mm" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional: Add specification like resistance, voltage, size, etc.</p>
                </div>

                <div>
                  <Label>Category *</Label>
                  <div className="relative">
                    <Select 
                      value={form.category || "Hand Tool"} 
                      onValueChange={v => {
                        setForm(f => ({ 
                          ...f, 
                          category: v as ToolCategory, 
                          subcategory: "Other", 
                          isConsumable: v === "Consumable" 
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2">
                          <Input
                            placeholder="Search or add new..."
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                            className="h-8"
                          />
                          {categorySearch && !filteredCategories.includes(categorySearch) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-1 justify-start text-xs"
                              onClick={handleAddCategory}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add "{categorySearch}"
                            </Button>
                          )}
                        </div>
                        {filteredCategories.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Subcategory *</Label>
                  <Select 
                    value={form.subcategory || "Other"} 
                    onValueChange={v => setForm(f => ({ ...f, subcategory: v as ToolSubcategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 pb-2">
                        <Input
                          placeholder="Search or add new..."
                          value={subcategorySearch}
                          onChange={e => setSubcategorySearch(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAddSubcategory()}
                          className="h-8"
                        />
                        {subcategorySearch && !filteredSubcategories.includes(subcategorySearch) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 justify-start text-xs"
                            onClick={handleAddSubcategory}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add "{subcategorySearch}"
                          </Button>
                        )}
                      </div>
                      {filteredSubcategories.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Lab / Location *</Label>
                  <Select 
                    value={form.lab || "Mechatronics Lab"} 
                    onValueChange={v => setForm(f => ({ ...f, lab: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {labOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="isConsumable" 
                    checked={form.isConsumable || false} 
                    onCheckedChange={(checked) => setForm(f => ({ ...f, isConsumable: checked === true }))} 
                  />
                  <div className="flex-1">
                    <Label htmlFor="isConsumable" className="text-sm font-normal cursor-pointer">
                      This is a consumable (bulk qty decrements on checkout)
                    </Label>
                  </div>
                </div>

                {(form.category === "Consumable" || form.isConsumable) && (
                  <div className="sm:col-span-2">
                    <Label>Consumable Type *</Label>
                    <Select 
                      value={form.consumableType || ""} 
                      onValueChange={v => setForm(f => ({ ...f, consumableType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {consumableTypeOptions.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stock</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Quantity *</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={form.quantity ?? 0} 
                    onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Select 
                    value={form.unit || "pcs"} 
                    onValueChange={v => setForm(f => ({ ...f, unit: v as ToolUnit }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Low Stock Threshold *</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={form.lowStockThreshold ?? 5} 
                    onChange={e => setForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 5 }))} 
                  />
                </div>
              </div>
            </div>

            {/* Storage Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Storage Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Storage Type</Label>
                  <Select 
                    value={form.storageType || "shelf"} 
                    onValueChange={v => setForm(f => ({ ...f, storageType: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {storageTypeOptions.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Position Code</Label>
                  <Input 
                    value={form.positionCode || ""} 
                    onChange={e => setForm(f => ({ ...f, positionCode: e.target.value }))} 
                    placeholder="e.g. A3, B12, Slot 5" 
                  />
                </div>

                <div className="sm:col-span-2 flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="trackMultipleLocations" 
                    checked={form.trackMultipleLocations || false} 
                    onCheckedChange={(checked) => setForm(f => ({ 
                      ...f, 
                      trackMultipleLocations: checked === true,
                      storageLocations: checked ? (f.storageLocations || []) : []
                    }))} 
                  />
                  <div className="flex-1">
                    <Label htmlFor="trackMultipleLocations" className="text-sm font-normal cursor-pointer">
                      Track multiple storage locations
                    </Label>
                  </div>
                </div>

                {form.trackMultipleLocations && (
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Storage Locations</Label>
                    {(form.storageLocations || []).map((loc, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Location (e.g. Drawer A3)"
                          value={loc.location}
                          onChange={e => updateStorageLocation(index, 'location', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={loc.quantity}
                          onChange={e => updateStorageLocation(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStorageLocation(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStorageLocation}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Location
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</h3>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={form.description || ""} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  rows={4}
                  placeholder="Add any additional notes, specifications, or instructions..."
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name?.trim()}>
              {editTool ? "Save Changes" : "Add Tool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTools;
