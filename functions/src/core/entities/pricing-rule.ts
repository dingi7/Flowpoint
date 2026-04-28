import z from "zod";
import { baseEntitySchema } from "./base";
import { DAY_OF_WEEK, TimeStringSchema } from "./calendar";

export enum PRICING_RULE_TYPE {
  PEAK_MULTIPLIER = "peak_multiplier",
  SLOW_PERIOD_DISCOUNT = "slow_period_discount",
  FIXED_OVERRIDE = "fixed_override",
}

export const pricingRuleDataSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PRICING_RULE_TYPE),
  active: z.boolean().default(true),
  daysOfWeek: z.array(z.nativeEnum(DAY_OF_WEEK)).default([]),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  serviceIds: z.array(z.string()).default([]),
  assigneeIds: z.array(z.string()).default([]),
  value: z.number().min(0),
  priority: z.number().int().default(0),
  label: z.string().optional(),
});

export type PricingRuleData = z.infer<typeof pricingRuleDataSchema>;
export const pricingRuleSchema = baseEntitySchema.merge(pricingRuleDataSchema);
export type PricingRule = z.infer<typeof pricingRuleSchema>;

export interface PriceQuote {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
  pricingRuleId?: string;
  pricingLabel?: string;
  pricingSnapshot?: {
    id: string;
    name: string;
    type: PRICING_RULE_TYPE;
    value: number;
    priority: number;
  };
}
