import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "In Stock": "bg-success/15 text-success border-success/30",
  "Checked Out": "bg-warning/15 text-warning border-warning/30",
  "Missing": "bg-destructive/15 text-destructive border-destructive/30",
  "Returned": "bg-success/15 text-success border-success/30",
  "Pending": "bg-warning/15 text-warning border-warning/30",
  "Pending Approval": "bg-warning/15 text-warning border-warning/30",
  "Approved": "bg-primary/15 text-primary border-primary/30",
  "Rejected": "bg-destructive/15 text-destructive border-destructive/30",
  "Available": "bg-success/15 text-success border-success/30",
  "Partially Issued": "bg-warning/15 text-warning border-warning/30",
  "Out of Stock": "bg-destructive/15 text-destructive border-destructive/30",
  "Low Stock": "bg-warning/15 text-warning border-warning/30",
  "Issued": "bg-primary/15 text-primary border-primary/30",
  "Overdue": "bg-destructive/15 text-destructive border-destructive/30",
  "Lost": "bg-destructive/15 text-destructive border-destructive/30",
  "Active": "bg-success/15 text-success border-success/30",
  "Banned": "bg-destructive/15 text-destructive border-destructive/30",
  "Recovered": "bg-success/15 text-success border-success/30",
  "Paid": "bg-primary/15 text-primary border-primary/30",
};

const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="outline" className={cn("font-medium", statusColors[status] || "")}>
    {status}
  </Badge>
);

export default StatusBadge;
