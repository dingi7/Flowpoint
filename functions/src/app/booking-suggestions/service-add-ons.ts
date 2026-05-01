import { AppointmentData, Service } from "@/core";

export type AppointmentAddOn = NonNullable<AppointmentData["addOns"]>[number];

export function normalizeAddOnServiceIds(payload: {
  addOnServiceIds?: string[];
  primaryServiceId: string;
}): string[] {
  return Array.from(new Set(payload.addOnServiceIds || [])).filter(
    (serviceId) => serviceId && serviceId !== payload.primaryServiceId,
  );
}

export function isCompatibleAddOn(payload: {
  addOnService: Service;
  primaryServiceId: string;
}): boolean {
  const compatibleWith = payload.addOnService.compatibleWithServiceIds || [];

  return (
    payload.addOnService.isAddOn === true &&
    payload.addOnService.id !== payload.primaryServiceId &&
    (compatibleWith.length === 0 ||
      compatibleWith.includes(payload.primaryServiceId))
  );
}

export function toAppointmentAddOnSnapshot(payload: {
  service: Service;
}): AppointmentAddOn {
  return {
    serviceId: payload.service.id,
    name: payload.service.name,
    price: payload.service.price,
    duration: payload.service.duration,
  };
}

export function getAddOnTotals(payload: { addOns: AppointmentAddOn[] }) {
  return payload.addOns.reduce(
    (totals, addOn) => ({
      price: totals.price + addOn.price,
      duration: totals.duration + addOn.duration,
    }),
    { price: 0, duration: 0 },
  );
}
