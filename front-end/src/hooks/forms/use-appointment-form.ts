import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Appointment, ASSIGNEE_TYPE, APPOINTMENT_STATUS, appointmentDataSchema, AppointmentData } from "@/core";


interface UseAppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (data: AppointmentData) => void | Promise<void>;
}

export function useAppointmentForm({ appointment, onSubmit }: UseAppointmentFormProps) {
  const form = useForm<AppointmentData>({
    resolver: zodResolver(appointmentDataSchema),
    defaultValues: {
      organizationId: appointment?.organizationId || "",
      assigneeType: appointment?.assigneeType || ASSIGNEE_TYPE.MEMBER,
      assigneeId: appointment?.assigneeId || "",
      customerId: appointment?.customerId || "",
      serviceId: appointment?.serviceId || "",
      title: appointment?.title || "",
      description: appointment?.description || "",
      startTime: appointment?.startTime || "",
      duration: appointment?.duration || 60,
      fee: appointment?.fee || undefined,
      status: appointment?.status || APPOINTMENT_STATUS.PENDING,
    },
    mode: "onChange", // Validate on change for better UX
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