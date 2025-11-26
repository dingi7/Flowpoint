import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InviteFormData,
  useCreateOrganizationInvite,
  useInviteForm,
  useRoles,
} from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { useTranslation } from "react-i18next";

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const { t } = useTranslation();
  const currentOrganizationId = useCurrentOrganizationId();
  const createInviteMutation = useCreateOrganizationInvite();

  const { data: roles = [] } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const {
    handleSubmit,
    register,
    handleRoleToggle,
    isValid,
    errors,
    touchedFields,
    selectedRoleIds,
  } = useInviteForm({
    onSubmit: async (data: InviteFormData) => {
      if (!currentOrganizationId) {
        throw new Error("No organization selected");
      }

      try {
        await createInviteMutation.mutateAsync({
          organizationId: currentOrganizationId,
          ...data,
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("Failed to create invite:", error);
      }
    },
  });

  const isSubmitting = createInviteMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="inviteeEmail">{t("team.invite.form.emailAddress")}</Label>
        <Input
          id="inviteeEmail"
          type="email"
          placeholder={t("team.invite.form.emailPlaceholder")}
          {...register("inviteeEmail")}
          disabled={isSubmitting}
        />
        {errors.inviteeEmail && touchedFields.inviteeEmail && (
          <p className="text-sm text-red-500">{errors.inviteeEmail.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="validFor">{t("team.invite.form.validFor")}</Label>
        <Input
          id="validFor"
          type="number"
          placeholder={t("team.invite.form.validForPlaceholder")}
          {...register("validFor", { valueAsNumber: true })}
          disabled={isSubmitting}
        />
        {errors.validFor && touchedFields.validFor && (
          <p className="text-sm text-red-500">{errors.validFor.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("team.invite.form.roles")}</Label>
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("team.invite.form.noRolesAvailable")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={(checked) =>
                      handleRoleToggle(role.id, checked as boolean)
                    }
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {role.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.inviteeRoleIds && (
          <p className="text-sm text-red-500">
            {errors.inviteeRoleIds.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("team.invite.form.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? t("team.invite.form.sending") : t("team.invite.form.send")}
        </Button>
      </div>
    </form>
  );
}
