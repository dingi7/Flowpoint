import {
  DAY_OF_WEEK,
  PRICING_RULE_TYPE,
  PriceQuote,
  PricingRule,
  Service,
} from "@/core";
import { getDayOfWeek, timeStringToMinutes } from "@/app/availability/util/helpers";

interface CalculatePricePayload {
  service: Service;
  startTime: Date;
  assigneeId: string;
  pricingRules: PricingRule[];
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function appliesToDay(payload: { rule: PricingRule; dayOfWeek: DAY_OF_WEEK }) {
  return (
    payload.rule.daysOfWeek.length === 0 ||
    payload.rule.daysOfWeek.includes(payload.dayOfWeek)
  );
}

function appliesToTime(payload: { rule: PricingRule; startTime: Date }) {
  const slotMinutes = minutesSinceMidnight(payload.startTime);
  const startMinutes = timeStringToMinutes(payload.rule.startTime);
  const endMinutes = timeStringToMinutes(payload.rule.endTime);

  if (startMinutes <= endMinutes) {
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  }

  return slotMinutes >= startMinutes || slotMinutes < endMinutes;
}

function appliesToService(payload: { rule: PricingRule; serviceId: string }) {
  return (
    payload.rule.serviceIds.length === 0 ||
    payload.rule.serviceIds.includes(payload.serviceId)
  );
}

function appliesToAssignee(payload: { rule: PricingRule; assigneeId: string }) {
  return (
    payload.rule.assigneeIds.length === 0 ||
    payload.rule.assigneeIds.includes(payload.assigneeId)
  );
}

function getPricingLabel(rule: PricingRule): string {
  if (rule.label) {
    return rule.label;
  }

  switch (rule.type) {
    case PRICING_RULE_TYPE.PEAK_MULTIPLIER:
      return "Peak price";
    case PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT:
      return "Slow period discount";
    case PRICING_RULE_TYPE.FIXED_OVERRIDE:
      return "Special price";
  }
}

function applyRule(payload: { basePrice: number; rule: PricingRule }): number {
  switch (payload.rule.type) {
    case PRICING_RULE_TYPE.PEAK_MULTIPLIER:
      return payload.basePrice * payload.rule.value;
    case PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT:
      return payload.basePrice * Math.max(0, 1 - payload.rule.value / 100);
    case PRICING_RULE_TYPE.FIXED_OVERRIDE:
      return payload.rule.value;
  }
}

export function calculatePriceQuote(
  payload: CalculatePricePayload,
): PriceQuote {
  const basePrice = payload.service.price || 0;
  const dayOfWeek = getDayOfWeek(payload.startTime);
  const applicableRule = payload.pricingRules
    .filter((rule) => rule.active)
    .filter((rule) => appliesToDay({ rule, dayOfWeek }))
    .filter((rule) => appliesToTime({ rule, startTime: payload.startTime }))
    .filter((rule) =>
      appliesToService({ rule, serviceId: payload.service.id }),
    )
    .filter((rule) =>
      appliesToAssignee({ rule, assigneeId: payload.assigneeId }),
    )
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
    )[0];

  if (!applicableRule) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
    };
  }

  const finalPrice = Math.max(
    0,
    Math.round(applyRule({ basePrice, rule: applicableRule }) * 100) / 100,
  );

  return {
    basePrice,
    finalPrice,
    discountAmount: Math.max(0, basePrice - finalPrice),
    pricingRuleId: applicableRule.id,
    pricingLabel: getPricingLabel(applicableRule),
    pricingSnapshot: {
      id: applicableRule.id,
      name: applicableRule.name,
      type: applicableRule.type,
      value: applicableRule.value,
      priority: applicableRule.priority,
    },
  };
}
