import { Role, RoleData, roleDataSchema } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface UseRoleFormProps {
  role?: Role;
  onSubmit: (data: RoleData) => void | Promise<void>;
}

export function useRoleForm({ role, onSubmit }: UseRoleFormProps) {
  const form = useForm<RoleData>({
    resolver: zodResolver(roleDataSchema),
    defaultValues: {
      name: role?.name || "",
      permissions: role?.permissions || [],
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const watchedName = form.watch("name");
  const watchedPermissions = form.watch("permissions");

  // Trigger validation when form values change to keep isValid state accurate
  useEffect(() => {
    form.trigger();
  }, [watchedName, watchedPermissions, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      // You can add toast notifications here if needed
    }
  });

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    touchedFields: form.formState.touchedFields,
  };
}
