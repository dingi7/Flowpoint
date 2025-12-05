import {
  Appointment,
  APPOINTMENT_STATUS,
  AppointmentData,
  appointmentDataSchema,
  ASSIGNEE_TYPE,
} from "@/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface UseAppointmentFormProps {
  appointment?: Appointment;
  onSubmit: (data: AppointmentData) => void | Promise<void>;
}

export function useAppointmentForm({
  appointment,
  onSubmit,
}: UseAppointmentFormProps) {
  const form = useForm<AppointmentData>({
    resolver: zodResolver(appointmentDataSchema),
    defaultValues: {
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
      // Re-throw error so the form component can handle it
      throw error;
    }
  });

  return {
    ...form,
    handleSubmit,
    trigger: form.trigger,
    clearErrors: form.clearErrors,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
}
