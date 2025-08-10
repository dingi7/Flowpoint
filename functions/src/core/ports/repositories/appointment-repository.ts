import { Appointment, AppointmentData, GenericRepository } from "@/core";

export type AppointmentRepository = GenericRepository<
  Appointment,
  AppointmentData
>;
