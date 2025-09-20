"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useRoles, useUpdateRole, useDeleteRole } from "@/hooks/repository-hooks/role/use-role";

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
import { Role, PermissionKey } from "@/core";
import {
  Edit,
  MoreHorizontal,
  Trash2,
  Shield,
  Users,
} from "lucide-react";
import { RoleForm } from "./RoleForm";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface RoleListProps {
  searchQuery: string;
}

export function RoleList({ searchQuery }: RoleListProps) {
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const currentOrganizationId = useCurrentOrganizationId();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } = useUpdateRole();
  const { mutateAsync: deleteRole, isPending: isDeletingRole } = useDeleteRole();

  // Fetch roles using the hook
  const { data: rolesData, error } = useRoles({
    pagination: { limit: 50 },
    orderBy: { field: "name", direction: "asc" },
  });

  console.log(error);

  const roles = rolesData || [];

  // Filter roles based on search
  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase());
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
    return permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (filteredRoles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No roles found</h3>
          <p className="text-muted-foreground text-center">
            {searchQuery 
              ? `No roles match "${searchQuery}". Try adjusting your search.`
              : "Get started by creating your first role."
            }
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
            Roles ({filteredRoles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
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
                          Role
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {getPermissionDisplayName(permission)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No permissions</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>
                    {role.updatedAt ? new Date(role.updatedAt).toLocaleDateString() : "N/A"}
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
                        <DropdownMenuItem onClick={() => handleEdit(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(role)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
            <DialogTitle>Edit Role</DialogTitle>
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
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deletingRole?.name}"? 
              This action cannot be undone and will remove this role from all members who have it assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRole(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeletingRole}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingRole ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}