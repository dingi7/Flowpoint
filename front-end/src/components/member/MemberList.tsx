"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useMembers, useUpdateMember } from "@/hooks/repository-hooks/member/use-member";
import { useRoles } from "@/hooks/repository-hooks/role/use-role";
import { useUser } from "@/stores/user-store";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useDeleteMemberFromOrganization } from "@/hooks";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Member } from "@/core";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { MemberDetails } from "./MemberDetails";
import { MemberEditForm } from "./MemberEditForm";

interface MemberListProps {
  searchQuery: string;
}

export function MemberList({ searchQuery }: MemberListProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const currentUser = useUser();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const currentOrganizationId = useCurrentOrganizationId();

  const { mutateAsync: updateMember, isPending: isUpdatingMember } = useUpdateMember();
  const { mutateAsync: deleteMemberFromOrg, isPending: isDeletingMember } = useDeleteMemberFromOrganization();

  // Fetch members using the hook
  const { data, error } = useMembers({
    pagination: { limit: 50 },
    queryConstraints: searchQuery ? [
      { field: "name", operator: ">=", value: searchQuery },
      { field: "name", operator: "<=", value: searchQuery + '\uf8ff' }
    ] : [],
    orderBy: {
      field: searchQuery.trim() ? "name" : "updatedAt",
      direction: "desc",
    },
  });

  // Fetch roles for display
  const { data: rolesData } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  console.log(error);

  // Flatten the infinite query data
  const members = data?.pages.flatMap(page => page) || [];
  const roles = rolesData || [];

  // Create a map for quick role lookup
  const roleMap = new Map(roles.map(role => [role.id, role]));

  // Filter members based on search (client-side filtering as fallback)
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setIsDetailsOpen(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsEditOpen(true);
  };

  const handleDelete = (member: Member) => {
    setDeletingMember(member);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingMember || !currentOrganizationId) {
      return;
    }

    try {
      await deleteMemberFromOrg({
        memberId: deletingMember.id,
        organizationId: currentOrganizationId,
      });
      setIsDeleteOpen(false);
      setDeletingMember(null);
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

  const isOwner = (member: Member) => {
    return member.name.includes("(Owner)");
  };

  const getMemberRoles = (roleIds: string[]) => {
    return roleIds.map(roleId => roleMap.get(roleId)).filter((role): role is NonNullable<typeof role> => Boolean(role));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-muted/20 hover:ring-primary/20 transition-all duration-200">
                        <AvatarImage
                          src={member.image}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Team Member{member.id === currentUser?.id && " (You)"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getMemberRoles(member.roleIds || []).map((role) => (
                        <Badge key={role.id} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      ))}
                      {(!member.roleIds || member.roleIds.length === 0) && (
                        <span className="text-sm text-muted-foreground">No roles assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    {member.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(member)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Member
                        </DropdownMenuItem>
                        {!isOwner(member) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(member)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No members found matching your criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberDetails
              member={selectedMember}
              onEdit={() => {
                setIsDetailsOpen(false);
                handleEdit(selectedMember);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberEditForm
              member={editingMember}
              onSubmit={async (data) => {
                await updateMember({
                  id: editingMember.id,
                  data,
                  organizationId: editingMember.organizationId,
                });
                setIsEditOpen(false);
              }}
              onCancel={() => setIsEditOpen(false)}
              isLoading={isUpdatingMember}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <AlertDialog 
        open={isDeleteOpen} 
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {
            setDeletingMember(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the member "{deletingMember?.name}"? 
              This action cannot be undone and will remove this member from the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteOpen(false);
              setDeletingMember(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingMember}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingMember ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}