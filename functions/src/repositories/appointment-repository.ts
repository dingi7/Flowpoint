import {
  Appointment,
  AppointmentData,
  AppointmentRepository,
  DatabaseService,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getAppointmentRepository(
  databaseService: DatabaseService,
): AppointmentRepository {
  return getGenericRepository<Appointment, AppointmentData>(
    () => DatabaseCollection.APPOINTMENTS,
    databaseService,
  );
}
