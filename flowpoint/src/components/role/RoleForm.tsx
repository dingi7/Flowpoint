import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionKey, Role, RoleData } from "@/core";
import { useRoleForm } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    [PermissionKey.MANAGE_MEMBERS]: t("team.role.form.permissionDescriptions.MANAGE_MEMBERS"),
    [PermissionKey.MANAGE_APPOINTMENTS]: t("team.role.form.permissionDescriptions.MANAGE_APPOINTMENTS"),
    [PermissionKey.MANAGE_CALENDARS]: t("team.role.form.permissionDescriptions.MANAGE_CALENDARS"),
    [PermissionKey.VIEW_REPORTS]: t("team.role.form.permissionDescriptions.VIEW_REPORTS"),
    [PermissionKey.MANAGE_ORGANIZATION]: t("team.role.form.permissionDescriptions.MANAGE_ORGANIZATION"),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("team.role.form.roleName")}</Label>
        <Input
          id="name"
          placeholder={t("team.role.form.namePlaceholder")}
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
        <Label>{t("team.role.form.permissions")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("team.role.form.permissionsDescription")}
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
            {t("team.role.form.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !formState.isValid}>
          {isLoading ? t("team.role.form.saving") : role ? t("team.role.form.update") : t("team.role.form.create")}
        </Button>
      </div>
    </form>
  );
}
