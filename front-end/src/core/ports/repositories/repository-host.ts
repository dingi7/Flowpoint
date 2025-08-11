import {
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  DatabaseService,
  MemberRepository,
  OrganizationRepository,
  RoleRepository,
  ServiceRepository,
  TimeOffRepository,
  UserRepository,
} from "@/core";

export interface RepositoryHost {
  getUserRepository(databaseService: DatabaseService): UserRepository;
  getCustomerRepository(databaseService: DatabaseService): CustomerRepository;
  getCalendarRepository(databaseService: DatabaseService): CalendarRepository;
  getMemberRepository(databaseService: DatabaseService): MemberRepository;
  getRoleRepository(databaseService: DatabaseService): RoleRepository;
  getServiceRepository(databaseService: DatabaseService): ServiceRepository;
  getOrganizationRepository(
    databaseService: DatabaseService,
  ): OrganizationRepository;
  getAppointmentRepository(
    databaseService: DatabaseService,
  ): AppointmentRepository;
  getTimeOffRepository(databaseService: DatabaseService): TimeOffRepository;
}
