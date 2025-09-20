import { MemberForm } from "@/components/member/MemberForm";
import { MemberList } from "@/components/member/MemberList";
import { RoleForm } from "@/components/role/RoleForm";
import { RoleList } from "@/components/role/RoleList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMembers } from "@/hooks/repository-hooks/member/use-member";
import { useRoles, useCreateRole } from "@/hooks/repository-hooks/role/use-role";
import {
  Plus,
  Search,
  Users,
  Shield,
  UserCheck,
  UserPlus
} from "lucide-react";
import { useState } from "react";

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);

  // Fetch members and roles for stats
  const { data: membersData } = useMembers({
    pagination: { limit: 100 },
    orderBy: { field: "updatedAt", direction: "desc" },
  });


  const { mutateAsync: createRole, isPending: isCreatingRole } = useCreateRole();

  const { data: rolesData } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const members = membersData?.pages.flatMap(page => page) || [];
  const roles = rolesData || [];

  // Calculate stats
  const totalMembers = members.length;
  const membersWithRoles = members.filter(member => member.roleIds && member.roleIds.length > 0).length;
  const totalRoles = roles.length;
  const recentMembers = members.filter(member => {
    if (!member.createdAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(member.createdAt) > weekAgo;
  }).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            Team Management
          </h2>
          <p className="text-muted-foreground">
            Manage your team members and roles
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isAddMemberOpen}
            onOpenChange={setIsAddMemberOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-2xl">
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
              </DialogHeader>
              <MemberForm
                onSuccess={() => setIsAddMemberOpen(false)}
                onCancel={() => setIsAddMemberOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAddRoleOpen}
            onOpenChange={setIsAddRoleOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <RoleForm
                onSubmit={async (data) => {
                  await createRole({
                    data,
                    organizationId: data.organizationId,
                  });
                  setIsAddRoleOpen(false);
                }}
                onCancel={() => setIsAddRoleOpen(false)}
                isLoading={isCreatingRole}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersWithRoles}</div>
            <p className="text-xs text-muted-foreground">
              Members with assigned roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              Defined roles in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMembers}</div>
            <p className="text-xs text-muted-foreground">
              Members added recently
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Search and Filters for Members */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Members List */}
          <MemberList searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          {/* Search and Filters for Roles */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Roles List */}
          <RoleList searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
