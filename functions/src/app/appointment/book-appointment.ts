import {
  APPOINTMENT_STATUS,
  AppointmentData,
  AppointmentRepository,
  CalendarRepository,
  CloudTasksService,
  CustomerRepository,
  LoggerService,
  MailgunService,
  MemberRepository,
  OrganizationRepository,
  PricingRuleRepository,
  Service,
  ServiceRepository,
  TimeOffRepository,
  UserRepository,
} from "@/core";
import { calculatePriceQuote } from "@/app/pricing/calculate-price";
import {
  getAddOnTotals,
  toAppointmentAddOnSnapshot,
} from "@/app/booking-suggestions/service-add-ons";
import { sendAppointmentEmailNotificationFn } from "../notification/send-appointment-email-notification";
import { validateBookingRequest } from "./validation/booking-validation";

interface Payload {
  serviceId: string;
  customerEmail: string;
  organizationId: string;
  startTime: string;
  assigneeId: string;
  addOnServiceIds?: string[];
  fee?: number;
  title?: string;
  description?: string;
  timezone?: string;
  customerData: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    customFields?: Record<string, unknown>;
  };
}

interface Dependencies {
  appointmentRepository: AppointmentRepository;
  serviceRepository: ServiceRepository;
  pricingRuleRepository: PricingRuleRepository;
  customerRepository: CustomerRepository;
  calendarRepository: CalendarRepository;
  timeOffRepository: TimeOffRepository;
  memberRepository: MemberRepository;
  userRepository: UserRepository;
  loggerService: LoggerService;
  organizationRepository: OrganizationRepository;
  mailgunService: MailgunService;
  cloudTasksServiceReminder: CloudTasksService;
  cloudTasksServiceReviewRequest: CloudTasksService;
  cloudTasksServiceRebooking: CloudTasksService;
}

interface BookingResult {
  appointmentId: string;
  confirmationDetails: {
    service: Service;
    customerId: string;
    startTime: string;
    endTime: string;
    duration: number;
    fee?: number;
    addOns?: ReturnType<typeof toAppointmentAddOnSnapshot>[];
    priceQuote?: ReturnType<typeof calculatePriceQuote>;
  };
}

interface BuildAppointmentIdPayload {
  customerName: string;
  startTimeIso: string;
}

function normalizeNameForAppointmentId(payload: {
  customerName: string;
}): string {
  const normalizedName = payload.customerName
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalizedName) {
    return "customer";
  }

  return normalizedName.slice(0, 80);
}

function buildDeterministicAppointmentId(payload: BuildAppointmentIdPayload): string {
  const normalizedName = normalizeNameForAppointmentId({
    customerName: payload.customerName,
  });
  const normalizedStartTime = payload.startTimeIso
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedName}-${normalizedStartTime}`;
}

/**
 * Comprehensive appointment booking function
 */
export async function bookAppointmentFn(
  payload: Payload,
  dependencies: Dependencies,
): Promise<BookingResult> {
  const { loggerService, appointmentRepository } = dependencies;

  loggerService.info("Starting appointment booking process", {
    serviceId: payload.serviceId,
    customerEmail: payload.customerEmail,
    startTime: payload.startTime,
  });

  // 1. Comprehensive validation
  const validationResult = await validateBookingRequest(
    {
      customerName: payload.customerData.name,
      customerPhone: payload.customerData.phone,
      customerAddress: payload.customerData.address,
      customerNotes: payload.customerData.notes,
      ...payload,
    },
    dependencies,
    payload.timezone,
  );

  const {
    validatedPayload,
    service,
    addOnServices,
    customerId,
    startTime,
    assigneeType,
    endTime,
    totalDuration,
  } = validationResult;
  const pricingRules = await dependencies.pricingRuleRepository.getAll({
    queryConstraints: [{ field: "active", operator: "==", value: true }],
    organizationId: validatedPayload.organizationId,
  });
  const priceQuote = calculatePriceQuote({
    service,
    startTime,
    assigneeId: validatedPayload.assigneeId,
    pricingRules,
  });
  const addOns = addOnServices.map((addOnService) =>
    toAppointmentAddOnSnapshot({ service: addOnService }),
  );
  const addOnTotals = getAddOnTotals({ addOns });
  const baseFee = priceQuote.basePrice + addOnTotals.price;
  const finalFee = priceQuote.finalPrice + addOnTotals.price;

  // 2. Create appointment
  const appointmentData: AppointmentData = {
    assigneeId: validatedPayload.assigneeId,
    assigneeType,
    customerId,
    serviceId: validatedPayload.serviceId,
    title: validatedPayload.title || service.name,
    description:
      validatedPayload.description ||
      `Appointment for ${[service.name, ...addOns.map((addOn) => addOn.name)].join(" + ")}`,
    startTime: startTime.toISOString(),
    duration: totalDuration,
    fee: finalFee,
    baseFee,
    finalFee,
    discountAmount: priceQuote.discountAmount,
    pricingRuleId: priceQuote.pricingRuleId,
    pricingSnapshot: priceQuote.pricingSnapshot,
    addOns,
    status: APPOINTMENT_STATUS.PENDING,
  };

  const appointmentId = buildDeterministicAppointmentId({
    customerName: payload.customerData.name,
    startTimeIso: startTime.toISOString(),
  });
  const existingAppointment = await appointmentRepository.get({
    id: appointmentId,
    organizationId: validatedPayload.organizationId,
  });
  const reusedExistingAppointment =
    !!existingAppointment &&
    existingAppointment.status !== APPOINTMENT_STATUS.CANCELLED;

  if (reusedExistingAppointment) {
    loggerService.warn("Duplicate booking request detected; reusing appointment", {
      appointmentId,
      customerId,
      serviceId: service.id,
      assigneeId: validatedPayload.assigneeId,
      startTime: startTime.toISOString(),
    });
  } else {
    await appointmentRepository.set({
      id: appointmentId,
      data: appointmentData,
      organizationId: validatedPayload.organizationId,
    });

    loggerService.info("Appointment created successfully", {
      appointmentId,
      customerId,
      serviceId: service.id,
    });

    await sendAppointmentEmailNotificationFn(
      {
        appointmentId,
        organizationId: validatedPayload.organizationId,
      },
      dependencies,
    );
  }

  // 5. Prepare confirmation details
  const confirmationDetails = {
    service,
    customerId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: totalDuration,
    fee: appointmentData.fee,
    addOns,
    priceQuote,
  };

  return {
    appointmentId,
    confirmationDetails,
  };
}
