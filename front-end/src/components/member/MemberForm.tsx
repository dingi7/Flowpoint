import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoles } from "@/hooks";
import { useInviteForm, InviteFormData, useCreateOrganizationInvite } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
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
        <Label htmlFor="inviteeEmail">Email Address</Label>
        <Input
          id="inviteeEmail"
          type="email"
          placeholder="Enter email address"
          {...register("inviteeEmail")}
          disabled={isSubmitting}
        />
        {errors.inviteeEmail && touchedFields.inviteeEmail && (
          <p className="text-sm text-red-500">
            {errors.inviteeEmail.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="validFor">Valid For (days)</Label>
        <Input
          id="validFor"
          type="number"
          placeholder="Enter valid for days"
          {...register("validFor", { valueAsNumber: true })}
          disabled={isSubmitting}
        />
        {errors.validFor && touchedFields.validFor && (
          <p className="text-sm text-red-500">
            {errors.validFor.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Roles</Label>
        <div className="space-y-2">
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles available</p>
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
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? "Sending Invite..." : "Send Invite"}
        </Button>
      </div>
    </form>
  );
}
