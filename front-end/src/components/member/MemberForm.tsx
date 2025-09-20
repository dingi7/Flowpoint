import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoles } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { serviceHost } from "@/services";

const inviteFormSchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
  inviteeRoleIds: z.array(z.string()).min(1, "Please select at least one role"),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const functionsService = serviceHost.getFunctionsService();
  const currentOrganizationId = useCurrentOrganizationId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: roles = [] } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const { handleSubmit, register, setValue, watch, formState } =
    useForm<InviteFormData>({
      resolver: zodResolver(inviteFormSchema),
      defaultValues: {
        inviteeEmail: "",
        inviteeRoleIds: [],
      },
      mode: "onChange",
    });

  const selectedRoleIds = watch("inviteeRoleIds") || [];

  const onSubmit = async (data: InviteFormData) => {
    if (!currentOrganizationId) {
      throw new Error("No organization selected");
    }

    setIsSubmitting(true);
    try {
      await functionsService.createOrganizationInvite({
        organizationId: currentOrganizationId,
        ...data,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = selectedRoleIds;
    if (checked) {
      setValue("inviteeRoleIds", [...currentRoles, roleId]);
    } else {
      setValue(
        "inviteeRoleIds",
        currentRoles.filter((id) => id !== roleId),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="inviteeEmail">Email Address</Label>
        <Input
          id="inviteeEmail"
          type="email"
          placeholder="Enter email address"
          {...register("inviteeEmail")}
          disabled={isSubmitting}
        />
        {formState.errors.inviteeEmail && (
          <p className="text-sm text-red-500">
            {formState.errors.inviteeEmail.message}
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
        {formState.errors.inviteeRoleIds && (
          <p className="text-sm text-red-500">
            {formState.errors.inviteeRoleIds.message}
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
        <Button type="submit" disabled={isSubmitting || !formState.isValid}>
          {isSubmitting ? "Sending Invite..." : "Send Invite"}
        </Button>
      </div>
    </form>
  );
}
