"use client";

import { LandingPageSettings, Organization } from "@/core";
import { createContext, useContext } from "react";

export type TenantContextValue = {
  organizationId: string;
  organization: Organization | null;
  landingPage: LandingPageSettings | null;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }

  return context;
}
