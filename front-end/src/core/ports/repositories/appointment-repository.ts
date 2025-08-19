import { Appointment, AppointmentData, GenericRepository, OrganizationIdPayload } from "@/core";

export type AppointmentRepository = GenericRepository<
  Appointment,
  AppointmentData,
  OrganizationIdPayload
>;
