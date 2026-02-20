import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Info, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (err: any) => {
      toast.error(`Failed to change password: ${err.message}`);
    },
  });

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: currentPw,
      newPassword: newPw,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings Card (Read Only for now) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>View your admin profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={user?.name || ""} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Username</Label>
                <Input value={user?.username || ""} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={user?.role || ""} disabled className="bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center italic">
                Profile edits are managed by system administrators.
              </p>
            </CardContent>
          </Card>

          {/* Account Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-5 w-5 text-primary" />
                Account Security
              </CardTitle>
              <CardDescription>Update your admin password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* System Information Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
              <CardDescription>ToolPort Management System Environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col rounded-md border p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Application</span>
                  <span className="text-sm font-medium">ToolPort MS</span>
                </div>
                <div className="flex flex-col rounded-md border p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Version</span>
                  <span className="text-sm font-medium">1.0.0-PROD</span>
                </div>
                <div className="flex flex-col rounded-md border p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Backend Env</span>
                  <span className="text-sm font-mono font-medium">Rust/Axum/PostgreSQL</span>
                </div>
                <div className="flex flex-col rounded-md border p-3">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Frontend Env</span>
                  <span className="text-sm font-medium">React/Vite/Shadcn</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;