import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const users = [
  { id: 1, name: "Admin User", username: "DIM/0245/25", role: "Admin" },
  { id: 2, name: "Dr. Wanjiku Mwangi", username: "LEC/001/25", role: "Lecturer" },
  { id: 3, name: "John Doe", username: "STU/001/25", role: "Student" },
  { id: 4, name: "Jane Doe", username: "STU/002/25", role: "Student" },
  { id: 5, name: "Peter Kamau", username: "STU/003/25", role: "Student" },
];

const AdminUsers = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default AdminUsers;
