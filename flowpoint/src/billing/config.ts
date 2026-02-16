export const PLANS = {
  basic: "basic",
  business: "business",
} as const;

export const FEATURES = {
  crm: "crm",
  landingPage: "landing_page",
} as const;

export const PLAN_ACCESS = [PLANS.basic, PLANS.business] as const;
