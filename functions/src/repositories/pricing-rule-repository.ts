import {
  DatabaseService,
  OrganizationIDPayload,
  PricingRule,
  PricingRuleData,
  PricingRuleRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getPricingRuleRepository(
  databaseService: DatabaseService,
): PricingRuleRepository {
  return getGenericRepository<
    PricingRule,
    PricingRuleData,
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.PRICING_RULES}`,
    databaseService,
  );
}
