"use client";

import { PricingTable, useAuth, useOrganization } from "@clerk/clerk-react";
import {
  CheckoutButton,
  SubscriptionDetailsButton,
  usePlans,
  useStatements,
  useSubscription,
} from "@clerk/clerk-react/experimental";
import { format } from "date-fns";
import {
  ArrowDown,
  CheckCircle2,
  Download,
  FileText,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InvoiceFilter = "all" | "active" | "archived";
type InvoiceSort = "most_recent" | "oldest";

interface MoneyAmount {
  amount: number;
  amountFormatted: string;
  currency: string;
  currencySymbol: string;
}

interface InvoiceRecord {
  id: string;
  label: string;
  createdAt: Date;
  status: "open" | "closed";
  planName: string;
  amountDisplay: string;
  lineItems: { name: string; amount: string }[];
}

function formatMoney(amount: MoneyAmount): string {
  const value = amount.amountFormatted.startsWith(amount.currencySymbol)
    ? amount.amountFormatted
    : `${amount.currencySymbol}${amount.amountFormatted}`;

  return `${amount.currency} ${value}`;
}

function formatMonthlyPrice(amount: MoneyAmount): string {
  const value = amount.amountFormatted.startsWith(amount.currencySymbol)
    ? amount.amountFormatted
    : `${amount.currencySymbol}${amount.amountFormatted}`;

  return `${value}/month`;
}

function getInvoiceLabel(statementId: string, index: number): string {
  const digitsOnly = statementId.replace(/\D/g, "");
  if (digitsOnly.length > 0) {
    return `Invoice ${digitsOnly.slice(-4).padStart(4, "0")}`;
  }

  return `Invoice ${String(index + 1).padStart(4, "0")}`;
}

export default function BillingPage() {
  const location = useLocation();
  const { organization } = useOrganization();
  const { isLoaded: isAuthLoaded, orgRole } = useAuth();

  const stateFrom = (location.state as { from?: string } | null)?.from;
  const searchParams = new URLSearchParams(location.search);
  const queryFrom = searchParams.get("from");
  const returnTo = stateFrom || queryFrom || "/dashboard";

  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceSort, setInvoiceSort] = useState<InvoiceSort>("most_recent");

  const isOrganizationOwner =
    Boolean(organization) &&
    isAuthLoaded &&
    (orgRole === "org:admin" || orgRole === "org:owner");

  const plans = usePlans({
    for: "organization",
    enabled: Boolean(organization),
    keepPreviousData: true,
    pageSize: 20,
  });

  const subscription = useSubscription({
    for: "organization",
    enabled: Boolean(organization),
    keepPreviousData: true,
  });

  const statements = useStatements({
    for: "organization",
    enabled: Boolean(organization),
    keepPreviousData: true,
    pageSize: 100,
  });

  const currentSubscriptionItem =
    subscription.data?.subscriptionItems.find(
      (item) => item.status === "active",
    ) ||
    subscription.data?.subscriptionItems.find(
      (item) => item.status !== "ended",
    );
  const currentPlanId = currentSubscriptionItem?.plan.id ?? null;

  const sortedPlans = useMemo(
    () =>
      [...plans.data].sort(
        (firstPlan, secondPlan) => firstPlan.fee.amount - secondPlan.fee.amount,
      ),
    [plans.data],
  );

  const normalizedInvoices = useMemo<InvoiceRecord[]>(() => {
    const sortedStatements = [...statements.data].sort(
      (firstStatement, secondStatement) =>
        secondStatement.timestamp.getTime() -
        firstStatement.timestamp.getTime(),
    );

    return sortedStatements.map((statement, index) => {
      const lineItems = statement.groups.flatMap((group) =>
        group.items.map((item) => ({
          name: item.subscriptionItem.plan.name,
          amount: item.amount ? formatMoney(item.amount) : "Included",
        })),
      );

      const planName =
        lineItems[0]?.name ||
        statement.groups[0]?.items[0]?.subscriptionItem.plan.name ||
        "Plan";

      return {
        id: statement.id,
        label: getInvoiceLabel(statement.id, index),
        createdAt: statement.timestamp,
        status: statement.status,
        planName,
        amountDisplay: formatMoney(statement.totals.grandTotal),
        lineItems,
      };
    });
  }, [statements.data]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = invoiceSearch.trim().toLowerCase();

    const filtered = normalizedInvoices.filter((invoice) => {
      const matchesFilter =
        invoiceFilter === "all" ||
        (invoiceFilter === "active" && invoice.status === "open") ||
        (invoiceFilter === "archived" && invoice.status === "closed");

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        invoice.label,
        invoice.planName,
        invoice.amountDisplay,
        invoice.id,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });

    return filtered.sort((firstInvoice, secondInvoice) => {
      if (invoiceSort === "most_recent") {
        return (
          secondInvoice.createdAt.getTime() - firstInvoice.createdAt.getTime()
        );
      }

      return (
        firstInvoice.createdAt.getTime() - secondInvoice.createdAt.getTime()
      );
    });
  }, [invoiceFilter, invoiceSearch, invoiceSort, normalizedInvoices]);

  const handleInvoiceFilterChange = (nextValue: string) => {
    if (
      nextValue === "all" ||
      nextValue === "active" ||
      nextValue === "archived"
    ) {
      setInvoiceFilter(nextValue);
    }
  };

  const handleDownloadInvoice = (invoice: InvoiceRecord) => {
    const invoiceLines = [
      `${invoice.label}`,
      `Invoice ID: ${invoice.id}`,
      `Date: ${format(invoice.createdAt, "dd MMM yyyy")}`,
      `Plan: ${invoice.planName}`,
      `Total: ${invoice.amountDisplay}`,
      "",
      "Line items:",
      ...invoice.lineItems.map(
        (lineItem, index) =>
          `${index + 1}. ${lineItem.name}: ${lineItem.amount}`,
      ),
    ];

    const blob = new Blob([invoiceLines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.label.toLowerCase().replace(/\s+/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const showPricingFallback = !plans.isLoading && sortedPlans.length === 0;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-[1.65rem]">
              Plans &amp; billing
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your plan and billing history here.
            </p>
          </div>
        </div>

        {!organization ? (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              Select an organization to manage billing.
            </CardContent>
          </Card>
        ) : (
          <>
            {!isOrganizationOwner ? (
              <Card>
                <CardContent className="text-sm text-muted-foreground">
                  Plan settings can only be managed by organization owners.
                </CardContent>
              </Card>
            ) : null}

            {showPricingFallback ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="mb-4 text-sm text-muted-foreground">
                  Custom plan cards are unavailable for this account, so the
                  default billing table is shown.
                </p>
                {isOrganizationOwner ? (
                  <PricingTable
                    for="organization"
                    newSubscriptionRedirectUrl={returnTo}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Contact an organization owner to update the plan.
                  </p>
                )}
              </div>
            ) : (
              <section className="rounded-3xl bg-muted/40 ">
                {plans.isLoading ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    Loading available plans...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {sortedPlans.map((plan) => {
                      const isCurrentPlan = currentPlanId === plan.id;

                      const planFeatures =
                        plan.features.length > 0
                          ? plan.features
                              .slice(0, 5)
                              .map((feature) => feature.name)
                          : plan.description
                            ? [plan.description]
                            : ["Plan features available in checkout details"];

                      return (
                        <Card
                          key={plan.id}
                          className={
                            isCurrentPlan
                              ? "h-full gap-4 rounded-2xl border-primary/35 bg-card py-5 shadow-md"
                              : "h-full gap-4 rounded-2xl bg-card py-5 shadow-none"
                          }
                        >
                          <CardContent className="flex h-full flex-col space-y-4 px-5">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-xl font-semibold text-foreground">
                                {plan.name}
                              </h3>
                              <p className="text-lg font-semibold text-muted-foreground">
                                {formatMonthlyPrice(plan.fee)}
                              </p>
                            </div>

                            <ul className="space-y-2.5 text-xs text-muted-foreground sm:text-sm">
                              {planFeatures.map((feature) => (
                                <li
                                  key={`${plan.id}-${feature}`}
                                  className="flex gap-2.5"
                                >
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>

                            {isCurrentPlan ? (
                              <div className="mt-auto">
                                {isOrganizationOwner ? (
                                  <SubscriptionDetailsButton for="organization">
                                    <Button
                                      variant="outline"
                                      className="h-9 w-full text-sm font-semibold"
                                    >
                                      Current plan
                                    </Button>
                                  </SubscriptionDetailsButton>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="h-9 w-full text-sm font-semibold"
                                    disabled
                                  >
                                    Current plan
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="mt-auto">
                                {isOrganizationOwner ? (
                                  <CheckoutButton
                                    for="organization"
                                    planId={plan.id}
                                    planPeriod="month"
                                    newSubscriptionRedirectUrl={returnTo}
                                  >
                                    <Button
                                      variant="outline"
                                      className="h-9 w-full text-sm font-semibold"
                                    >
                                      Switch to this plan
                                    </Button>
                                  </CheckoutButton>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className="h-9 w-full text-sm font-semibold"
                                    disabled
                                  >
                                    Only owners can switch plans
                                  </Button>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                Previous invoices
              </h3>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                  value={invoiceFilter}
                  onValueChange={handleInvoiceFilterChange}
                  className="w-fit"
                >
                  <TabsList>
                    <TabsTrigger value="all">View all</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
                  <div className="relative w-full sm:min-w-72 lg:min-w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={invoiceSearch}
                      onChange={(event) => setInvoiceSearch(event.target.value)}
                      placeholder="Search"
                      className="h-11 pl-9"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="h-11 gap-2 px-4"
                    onClick={() =>
                      setInvoiceSort((currentSort) =>
                        currentSort === "most_recent"
                          ? "oldest"
                          : "most_recent",
                      )
                    }
                  >
                    <ArrowDown className="h-4 w-4" />
                    {invoiceSort === "most_recent"
                      ? "Most recent"
                      : "Oldest first"}
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Invoice</span>
                  <span>Date</span>
                  <span>Plan</span>
                  <span>Amount</span>
                  <span className="text-right">Download</span>
                </div>

                {statements.isLoading ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading invoices...
                  </div>
                ) : statements.error ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Unable to load invoices right now.
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No invoices found for the selected filters.
                  </div>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-1 gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-foreground">
                            {invoice.label}
                          </p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {format(invoice.createdAt, "dd MMM yyyy")} •{" "}
                            {invoice.planName} • {invoice.amountDisplay}
                          </p>
                        </div>
                      </div>

                      <p className="hidden text-sm text-muted-foreground sm:block">
                        {format(invoice.createdAt, "dd MMM yyyy")}
                      </p>
                      <p className="hidden truncate text-sm text-muted-foreground sm:block">
                        {invoice.planName}
                      </p>
                      <p className="hidden text-sm font-medium text-foreground sm:block">
                        {invoice.amountDisplay}
                      </p>

                      <div className="flex justify-start sm:justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={`Download ${invoice.label}`}
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
