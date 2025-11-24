import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionKey, Role, RoleData } from "@/core";
import { useRoleForm } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: RoleData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function RoleForm({
  role,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoleFormProps) {
  const currentOrganizationId = useCurrentOrganizationId();

  const { handleSubmit, register, setValue, watch, formState, touchedFields } =
    useRoleForm({
      role,
      onSubmit: async (data: RoleData) => {
        if (!currentOrganizationId) {
          throw new Error("No organization selected");
        }

        const roleData = {
          ...data,
          organizationId: currentOrganizationId,
        };

        await onSubmit(roleData);
      },
    });

  const selectedPermissions = watch("permissions") || [];

  const handlePermissionToggle = (
    permission: PermissionKey,
    checked: boolean,
  ) => {
    const currentPermissions = selectedPermissions;
    if (checked) {
      setValue("permissions", [...currentPermissions, permission]);
    } else {
      setValue(
        "permissions",
        currentPermissions.filter((p) => p !== permission),
      );
    }
  };

  // Permission descriptions for better UX
  const permissionDescriptions: Record<PermissionKey, string> = {
    [PermissionKey.MANAGE_MEMBERS]: "Create, edit, and delete team members",
    [PermissionKey.MANAGE_APPOINTMENTS]:
      "Create, edit, and delete appointments",
    [PermissionKey.MANAGE_CALENDARS]:
      "Manage calendar settings and availability",
    [PermissionKey.VIEW_REPORTS]: "Access reports and analytics",
    [PermissionKey.MANAGE_ORGANIZATION]:
      "Manage organization settings and configuration",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          placeholder="Enter role name (e.g., Manager, Assistant)"
          {...register("name")}
          disabled={isLoading}
        />
        {formState.errors.name && touchedFields.name && (
          <p className="text-sm text-red-500">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <p className="text-sm text-muted-foreground">
          Select the permissions this role should have
        </p>
        <div className="space-y-3 border rounded-md p-4">
          {Object.values(PermissionKey).map((permission) => (
            <div key={permission} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${permission}`}
                checked={selectedPermissions.includes(permission)}
                onCheckedChange={(checked) =>
                  handlePermissionToggle(permission, checked as boolean)
                }
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor={`permission-${permission}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {permission
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {permissionDescriptions[permission]}
                </p>
              </div>
            </div>
          ))}
        </div>
        {formState.errors.permissions && (
          <p className="text-sm text-red-500">
            {formState.errors.permissions.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formState.isValid}>
          {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
