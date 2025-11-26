"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteMemberFromOrganization } from "@/hooks";
import {
  useMembers,
  useUpdateMember,
} from "@/hooks/repository-hooks/member/use-member";
import { useRoles } from "@/hooks/repository-hooks/role/use-role";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useUser } from "@/stores/user-store";
import { useState } from "react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Member } from "@/core";
import { Edit, Eye, MoreHorizontal, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MemberDetails } from "./MemberDetails";
import { MemberEditForm } from "./MemberEditForm";

interface MemberListProps {
  searchQuery: string;
}

export function MemberList({ searchQuery }: MemberListProps) {
  const { t } = useTranslation();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const currentUser = useUser();
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const currentOrganizationId = useCurrentOrganizationId();

  const { mutateAsync: updateMember, isPending: isUpdatingMember } =
    useUpdateMember();
  const { mutateAsync: deleteMemberFromOrg, isPending: isDeletingMember } =
    useDeleteMemberFromOrganization();

  // Fetch members using the hook
  const { data, error } = useMembers({
    pagination: { limit: 50 },
    queryConstraints: searchQuery
      ? [
          { field: "name", operator: ">=", value: searchQuery },
          { field: "name", operator: "<=", value: searchQuery + "\uf8ff" },
        ]
      : [],
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
  const members = data?.pages.flatMap((page) => page) || [];
  const roles = rolesData || [];

  // Create a map for quick role lookup
  const roleMap = new Map(roles.map((role) => [role.id, role]));

  // Filter members based on search (client-side filtering as fallback)
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
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

  const canDeleteMember = (member: Member) => {
    // Don't allow users to delete themselves
    if (member.id === currentUser?.id) {
      return false;
    }
    // Don't allow deleting owners
    if (isOwner(member)) {
      return false;
    }
    return true;
  };

  const getMemberRoles = (roleIds: string[]) => {
    return roleIds
      .map((roleId) => roleMap.get(roleId))
      .filter((role): role is NonNullable<typeof role> => Boolean(role));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("team.members")} ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("team.tableHeaders.member")}</TableHead>
                <TableHead>{t("team.tableHeaders.roles")}</TableHead>
                <TableHead>{t("team.tableHeaders.created")}</TableHead>
                <TableHead>{t("team.tableHeaders.updated")}</TableHead>
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
                          {t("team.teamMember")}{member.id === currentUser?.id && ` (${t("team.you")})`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getMemberRoles(member.roleIds || []).map((role) => (
                        <Badge
                          key={role.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {role.name}
                        </Badge>
                      ))}
                      {(!member.roleIds || member.roleIds.length === 0) && (
                        <span className="text-sm text-muted-foreground">
                          {t("team.noRolesAssigned")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString()
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    {member.updatedAt
                      ? new Date(member.updatedAt).toLocaleDateString()
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("team.actions.label")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(member)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("team.actions.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t("team.actions.edit")}
                        </DropdownMenuItem>
                        {canDeleteMember(member) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(member)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("team.actions.delete")}
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
                {t("team.noResults")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("team.details")}</DialogTitle>
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
            <DialogTitle>{t("team.edit")}</DialogTitle>
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
            <AlertDialogTitle>{t("team.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("team.delete.description", { name: deletingMember?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteOpen(false);
                setDeletingMember(null);
              }}
            >
              {t("team.delete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingMember}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingMember ? t("team.delete.deleting") : t("team.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
