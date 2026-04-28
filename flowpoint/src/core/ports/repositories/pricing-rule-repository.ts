import {
  GenericRepository,
  OrganizationIdPayload,
  PricingRule,
  PricingRuleData,
} from "@/core";

export type PricingRuleRepository = GenericRepository<
  PricingRule,
  PricingRuleData,
  OrganizationIdPayload
>;
