import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Users, RefreshCw, Search, Plus, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStoreData } from "@/hooks/useStoreData";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: AppRole | null;
  full_name: string;
  student_id: string;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

export default function UserManagement() {
  const { role, loading: roleLoading, isAdmin } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkParentId, setLinkParentId] = useState("");
  const [linkStudentId, setLinkStudentId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("student");
  const [newFullName, setNewFullName] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { students } = useStoreData();

  async function fetchUsers() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      method: "GET",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (res.error) {
      toast({ title: "Error loading users", description: res.error.message, variant: "destructive" });
    } else {
      setUsers(res.data as UserWithRole[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function handleRoleChange(userId: string, newRole: AppRole) {
    setUpdating(userId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: { user_id: userId, role: newRole },
    });

    if (res.error) {
      toast({ title: "Error updating role", description: res.error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated", description: `User role changed to ${newRole}` });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setUpdating(null);
  }

  async function handleCreateAccount() {
    if (!newEmail || !newPassword || !newRole) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users?action=create-account", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: {
        email: newEmail,
        password: newPassword,
        role: newRole,
        full_name: newFullName,
        student_id: newStudentId,
      },
    });

    if (res.error || res.data?.error) {
      toast({ title: "Error creating account", description: res.error?.message || res.data?.error, variant: "destructive" });
    } else {
      toast({ title: "Account created", description: `${newRole} account created for ${newEmail}` });
      setCreateDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("student");
      setNewFullName("");
      setNewStudentId("");
      fetchUsers();
    }
    setCreating(false);
  }

  async function handleLinkParent() {
    if (!linkParentId || !linkStudentId) {
      toast({ title: "Select both parent and student", variant: "destructive" });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users?action=link-parent", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: { parent_user_id: linkParentId, student_id: linkStudentId },
    });

    if (res.error || res.data?.error) {
      toast({ title: "Error linking", description: res.error?.message || res.data?.error, variant: "destructive" });
    } else {
      toast({ title: "Parent linked to student successfully" });
      setLinkDialogOpen(false);
      setLinkParentId("");
      setLinkStudentId("");
    }
  }

  if (roleLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const parentUsers = users.filter((u) => u.role === "parent");

  const roleBadgeVariant = (r: AppRole | null) =>
    r === "admin" ? "default" : r === "teacher" ? "secondary" : r === "student" ? "outline" : r === "parent" ? "outline" : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage user accounts for teachers, students, and parents
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setLinkDialogOpen(true)} variant="outline">
            <Link2 className="w-4 h-4 mr-1" />
            Link Parent
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create Account
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Users ({filtered.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell>
                      {u.role ? (
                        <Badge variant={roleBadgeVariant(u.role)}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">No Role</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={u.role || ""}
                        onValueChange={(val) => handleRoleChange(u.id, val as AppRole)}
                        disabled={updating === u.id}
                      >
                        <SelectTrigger className="w-32 ml-auto">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(newRole === "student") && (
              <div>
                <Label>Link to Student ID (from student records)</Label>
                <Select value={newStudentId} onValueChange={setNewStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student record" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.studentId} value={s.studentId}>
                        {s.studentId} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={handleCreateAccount} disabled={creating}>
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Parent Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Parent to Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Parent Account</Label>
              <Select value={linkParentId} onValueChange={setLinkParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {parentUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student</Label>
              <Select value={linkStudentId} onValueChange={setLinkStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.studentId} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleLinkParent}>
              Link Parent to Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
