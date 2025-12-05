import { Customer, CustomerData, customerDataSchema } from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UseCustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerData) => void | Promise<void>;
}

export function useCustomerForm({ customer, onSubmit }: UseCustomerFormProps) {
  const form = useForm<CustomerData>({
    resolver: zodResolver(customerDataSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
      customFields: customer?.customFields || {},
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
