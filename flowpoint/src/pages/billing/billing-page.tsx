"use client";

import { PricingTable, useOrganization } from "@clerk/clerk-react";
import { SubscriptionDetailsButton } from "@clerk/clerk-react/experimental";
import { useLocation } from "react-router-dom";

export default function BillingPage() {
  const location = useLocation();
  const { organization } = useOrganization();

  const stateFrom = (location.state as { from?: string } | null)?.from;
  const searchParams = new URLSearchParams(location.search);
  const queryFrom = searchParams.get("from");
  const returnTo = stateFrom || queryFrom || "/dashboard";

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Billing</h2>
            <p className="text-muted-foreground">
              Manage your organization subscription and billing details.
            </p>
          </div>
          {organization ? (
            <SubscriptionDetailsButton for="organization" />
          ) : null}
        </div>

        {!organization ? (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            Select an organization to manage billing.
          </div>
        ) : (
          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl={returnTo}
          />
        )}
      </div>
    </main>
  );
}
