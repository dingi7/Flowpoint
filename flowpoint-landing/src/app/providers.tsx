'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "./context/LocaleContext";
import { useState } from "react";
import { TenantContextValue, TenantProvider } from "./context/TenantContext";

export function Providers({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: TenantContextValue;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider value={tenant}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}
