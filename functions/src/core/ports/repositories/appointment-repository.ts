import {
  Appointment,
  AppointmentData,
  GenericRepository,
  OrganizationIDPayload,
} from "@/core";

export type AppointmentRepository = GenericRepository<
  Appointment,
  AppointmentData,
  OrganizationIDPayload
>;
