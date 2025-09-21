import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const inviteFormSchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
  inviteeRoleIds: z.array(z.string()).min(1, "Please select at least one role"),
  validFor: z.number().default(7).optional(),
});

export type InviteFormData = z.infer<typeof inviteFormSchema>;

interface UseInviteFormProps {
  onSubmit: (data: InviteFormData) => void | Promise<void>;
}

export function useInviteForm({ onSubmit }: UseInviteFormProps) {
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      inviteeEmail: "",
      inviteeRoleIds: [],
      validFor: 7,
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedEmail = form.watch("inviteeEmail");
  const watchedRoleIds = form.watch("inviteeRoleIds");
  const watchedValidFor = form.watch("validFor");

  // Trigger validation when form values change to keep isValid state accurate
  useEffect(() => {
    form.trigger();
  }, [watchedEmail, watchedRoleIds, watchedValidFor, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      // You can add toast notifications here if needed
    }
  });

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    const currentRoles = watchedRoleIds || [];
    if (checked) {
      form.setValue("inviteeRoleIds", [...currentRoles, roleId]);
    } else {
      form.setValue(
        "inviteeRoleIds",
        currentRoles.filter((id) => id !== roleId),
      );
    }
  };

  return {
    ...form,
    handleSubmit,
    handleRoleToggle,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    touchedFields: form.formState.touchedFields,
    selectedRoleIds: watchedRoleIds || [],
  };
}