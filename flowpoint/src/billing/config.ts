export const PLANS = {
  freeOrg: "free_org",
  basic: "basic",
  business: "business",
} as const;

export const FEATURES = {
  crm: "crm",
  landingPage: "landing_page",
  api: "api",
  webhooks: "webhooks",
} as const;

export const FREE_LIMITS = {
  members: 2,
  services: 2,
} as const;

export const PLAN_ACCESS = [
  PLANS.freeOrg,
  PLANS.basic,
  PLANS.business,
] as const;
