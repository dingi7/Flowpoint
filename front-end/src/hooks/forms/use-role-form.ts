import { Role, RoleData, roleDataSchema } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UseRoleFormProps {
  role?: Role;
  onSubmit: (data: RoleData) => void | Promise<void>;
}

export function useRoleForm({ role, onSubmit }: UseRoleFormProps) {
  const form = useForm<RoleData>({
    resolver: zodResolver(roleDataSchema),
    defaultValues: {
      organizationId: role?.organizationId || "",
      name: role?.name || "",
      permissions: role?.permissions || [],
    },
    mode: "onChange",
  });

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
  };
}