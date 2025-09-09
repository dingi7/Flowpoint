import { Service, ServiceData, serviceDataSchema, OWNER_TYPE } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UseServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceData) => void | Promise<void>;
}

export function useServiceForm({ service, onSubmit }: UseServiceFormProps) {
  const form = useForm<ServiceData>({
    resolver: zodResolver(serviceDataSchema),
    defaultValues: {
      organizationId: service?.organizationId || "",
      ownerType: service?.ownerType || OWNER_TYPE.ORGANIZATION,
      ownerId: service?.ownerId || "",
      name: service?.name || "",
      description: service?.description || "",
      price: service?.price || 0,
      duration: service?.duration || 60,
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (data: ServiceData) => {
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