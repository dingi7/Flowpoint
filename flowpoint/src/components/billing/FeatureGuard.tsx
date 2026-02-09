import { useAuth } from "@clerk/clerk-react";
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface FeatureGuardProps {
  feature: string;
  children: ReactNode;
}

export function FeatureGuard({ feature, children }: FeatureGuardProps) {
  const location = useLocation();
  const { isLoaded, orgId, has } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!orgId) {
    return <>{children}</>;
  }

  if (!has({ feature })) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/billing" replace state={{ from }} />;
  }

  return <>{children}</>;
}
