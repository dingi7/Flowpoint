"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "@/hooks/repository-hooks/role/use-role";
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
import { PermissionKey, Role } from "@/core";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Edit, MoreHorizontal, Shield, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RoleForm } from "./RoleForm";

interface RoleListProps {
  searchQuery: string;
}

export function RoleList({ searchQuery }: RoleListProps) {
  const { t } = useTranslation();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const currentOrganizationId = useCurrentOrganizationId();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } =
    useUpdateRole();
  const { mutateAsync: deleteRole, isPending: isDeletingRole } =
    useDeleteRole();

  // Fetch roles using the hook
  const { data: rolesData, error } = useRoles({
    pagination: { limit: 50 },
    orderBy: { field: "name", direction: "asc" },
  });

  console.log(error);

  const roles = rolesData || [];

  // Filter roles based on search
  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsEditOpen(true);
  };

  const handleDelete = (role: Role) => {
    setDeletingRole(role);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRole || !currentOrganizationId) return;

    try {
      await deleteRole({
        id: deletingRole.id,
        organizationId: currentOrganizationId,
      });
      setIsDeleteOpen(false);
      setDeletingRole(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
    }
  };

  // Permission display names
  const getPermissionDisplayName = (permission: PermissionKey) => {
    return permission
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (filteredRoles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("team.role.noResults")}</h3>
          <p className="text-muted-foreground text-center">
            {searchQuery
              ? t("team.role.noResultsSearch", { query: searchQuery })
              : t("team.role.getStarted")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("team.roles")} ({filteredRoles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("team.role.tableHeaders.role")}</TableHead>
                <TableHead>{t("team.role.tableHeaders.permissions")}</TableHead>
                <TableHead>{t("team.role.tableHeaders.created")}</TableHead>
                <TableHead>{t("team.role.tableHeaders.updated")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {role.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {t("team.roles")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((permission) => (
                          <Badge
                            key={permission}
                            variant="secondary"
                            className="text-xs"
                          >
                            {getPermissionDisplayName(permission)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t("team.role.noPermissions")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.createdAt
                      ? new Date(role.createdAt).toLocaleDateString()
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    {role.updatedAt
                      ? new Date(role.updatedAt).toLocaleDateString()
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
                        <DropdownMenuLabel>{t("team.role.actions.label")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("team.role.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(role)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("team.role.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("team.role.editTitle")}</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <RoleForm
              role={editingRole}
              onSubmit={async (data) => {
                if (!currentOrganizationId) return;
                await updateRole({
                  id: editingRole.id,
                  data,
                  organizationId: currentOrganizationId,
                });
                setIsEditOpen(false);
                setEditingRole(null);
              }}
              onCancel={() => {
                setIsEditOpen(false);
                setEditingRole(null);
              }}
              isLoading={isUpdatingRole}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("team.role.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("team.role.deleteDescription", { name: deletingRole?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRole(null)}>
              {t("team.role.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingRole}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingRole ? t("team.role.deleting") : t("team.role.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
