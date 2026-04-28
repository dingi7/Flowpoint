import {
  AppointmentRepository,
  CalendarRepository,
  CustomerRepository,
  DatabaseService,
  InviteRepository,
  MemberRepository,
  OrganizationRepository,
  PricingRuleRepository,
  ReviewRepository,
  RoleRepository,
  ServiceRepository,
  TimeOffRepository,
  UserRepository,
  WebhookSubscriptionRepository,
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
  getReviewRepository(databaseService: DatabaseService): ReviewRepository;
  getTimeOffRepository(databaseService: DatabaseService): TimeOffRepository;
  getInviteRepository(databaseService: DatabaseService): InviteRepository;
  getWebhookSubscriptionRepository(
    databaseService: DatabaseService,
  ): WebhookSubscriptionRepository;
  getPricingRuleRepository(databaseService: DatabaseService): PricingRuleRepository;
}
