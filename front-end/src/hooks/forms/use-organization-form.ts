import { Organization, OrganizationData, organizationDataSchema, DAY_OF_WEEK } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldValues } from "react-hook-form";

interface UseOrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: OrganizationData) => void | Promise<void>;
}

export function useOrganizationForm({ organization, onSubmit }: UseOrganizationFormProps) {
  const form = useForm({
    resolver: zodResolver(organizationDataSchema),
    defaultValues: {
      name: organization?.name || "",
      image: organization?.image,
      industry: organization?.industry,
      currency: organization?.currency || "EUR",
      settings: {
        timezone: organization?.settings?.timezone || "UTC",
        workingDays: organization?.settings?.workingDays || [
          DAY_OF_WEEK.MONDAY,
          DAY_OF_WEEK.TUESDAY, 
          DAY_OF_WEEK.WEDNESDAY,
          DAY_OF_WEEK.THURSDAY,
          DAY_OF_WEEK.FRIDAY
        ],
        defaultBufferTime: organization?.settings?.defaultBufferTime || 0,
        appointmentCancellationPolicyHours: organization?.settings?.appointmentCancellationPolicyHours || 24,
        customerFields: organization?.settings?.customerFields || [],
      },
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (data: FieldValues) => {
    try {
      await onSubmit(data as OrganizationData);
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