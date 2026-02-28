import { useAuth } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { PLAN_ACCESS } from "@/billing/config";

interface BillingGuardProps {
  children: ReactNode;
}

const EXEMPT_PATHS = ["/billing", "/sign-in", "/sign-up", "/review"];

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATHS.some((path) => pathname.startsWith(path));
}

export function BillingGuard({ children }: BillingGuardProps) {
  const location = useLocation();
  const { isLoaded, isSignedIn, orgId, has } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (isExemptPath(location.pathname)) {
    return <>{children}</>;
  }

  if (!orgId) {
    return <>{children}</>;
  }

  const hasPlanAccess = PLAN_ACCESS.some((plan) => has({ plan }));

  if (!hasPlanAccess) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/billing" replace state={{ from }} />;
  }

  return <>{children}</>;
}
