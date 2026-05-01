import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DAY_OF_WEEK,
  ANALYTICS_INSIGHT_TYPE,
  PRICING_RULE_TYPE,
  PricingRule,
  PricingRuleData,
} from "@/core";
import {
  useAnalyticsDashboard,
  useCreatePricingRule,
  useDeletePricingRule,
  useMembers,
  usePricingRules,
  useServices,
  useUpdatePricingRule,
} from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { formatPrice } from "@/utils/price-format";
import { CalendarClock, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const DAY_OPTIONS = [
  DAY_OF_WEEK.MONDAY,
  DAY_OF_WEEK.TUESDAY,
  DAY_OF_WEEK.WEDNESDAY,
  DAY_OF_WEEK.THURSDAY,
  DAY_OF_WEEK.FRIDAY,
  DAY_OF_WEEK.SATURDAY,
  DAY_OF_WEEK.SUNDAY,
];

const DEFAULT_FORM: PricingRuleData = {
  name: "",
  type: PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT,
  active: true,
  daysOfWeek: [],
  startTime: "09:00",
  endTime: "18:00",
  serviceIds: [],
  assigneeIds: [],
  value: 10,
  priority: 0,
  label: "",
};

function getRuleDescription(rule: PricingRule) {
  switch (rule.type) {
    case PRICING_RULE_TYPE.PEAK_MULTIPLIER:
      return `${rule.value}x multiplier`;
    case PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT:
      return `${rule.value}% discount`;
    case PRICING_RULE_TYPE.FIXED_OVERRIDE:
      return `${formatPrice(rule.value)} fixed price`;
  }
}

export default function PricingRulesPage() {
  const organizationId = useCurrentOrganizationId();
  const pricingRulesQuery = usePricingRules({
    pagination: { limit: 100 },
    orderBy: { field: "priority", direction: "desc" },
  });
  const servicesQuery = useServices({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });
  const membersQuery = useMembers({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });
  const analyticsQuery = useAnalyticsDashboard();
  const createPricingRule = useCreatePricingRule();
  const updatePricingRule = useUpdatePricingRule();
  const deletePricingRule = useDeletePricingRule();
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [form, setForm] = useState<PricingRuleData>(DEFAULT_FORM);
  const [searchParams] = useSearchParams();

  const pricingRules = useMemo(
    () => pricingRulesQuery.data?.pages.flatMap((page) => page) || [],
    [pricingRulesQuery.data],
  );
  const services = servicesQuery.data?.pages.flatMap((page) => page) || [];
  const members = membersQuery.data?.pages.flatMap((page) => page) || [];

  useEffect(() => {
    const type = searchParams.get("type");
    const dayOfWeek = searchParams.get("dayOfWeek") as DAY_OF_WEEK | null;
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const name = searchParams.get("name");
    const value = Number(searchParams.get("value"));
    const priority = Number(searchParams.get("priority"));
    const label = searchParams.get("label");

    if (
      (type === PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT ||
        type === PRICING_RULE_TYPE.PEAK_MULTIPLIER) &&
      dayOfWeek &&
      startTime &&
      endTime
    ) {
      const isPeak = type === PRICING_RULE_TYPE.PEAK_MULTIPLIER;
      setForm({
        ...DEFAULT_FORM,
        name: name || (isPeak ? "Peak period price" : "Slow period discount"),
        type,
        daysOfWeek: [dayOfWeek],
        startTime,
        endTime,
        value: Number.isFinite(value) && value > 0 ? value : isPeak ? 1.15 : 10,
        priority:
          Number.isFinite(priority) && priority >= 0
            ? priority
            : isPeak
              ? 20
              : 10,
        label: label || (isPeak ? "Peak price" : "Off-peak discount"),
      });
    }
  }, [searchParams]);

  const applyInsight = (insight: NonNullable<typeof analyticsQuery.data>["insights"][number]) => {
    if (
      !insight.dayOfWeek ||
      insight.startHour === undefined ||
      insight.endHour === undefined
    ) {
      return;
    }

    const isPeak = insight.type === ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD;
    setEditingRule(null);
    setForm({
      ...DEFAULT_FORM,
      name: insight.message,
      type: isPeak
        ? PRICING_RULE_TYPE.PEAK_MULTIPLIER
        : PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT,
      daysOfWeek: [insight.dayOfWeek],
      startTime: `${String(insight.startHour).padStart(2, "0")}:00`,
      endTime: `${String(insight.endHour).padStart(2, "0")}:00`,
      value: isPeak ? 1.15 : 10,
      priority: isPeak ? 20 : 10,
      label: isPeak ? "Peak price" : "Off-peak discount",
    });
  };

  const resetForm = () => {
    setEditingRule(null);
    setForm(DEFAULT_FORM);
  };

  const toggleArrayValue = <T extends string>(payload: {
    values: T[];
    value: T;
  }) => {
    return payload.values.includes(payload.value)
      ? payload.values.filter((item) => item !== payload.value)
      : [...payload.values, payload.value];
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      type: rule.type,
      active: rule.active,
      daysOfWeek: rule.daysOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      serviceIds: rule.serviceIds,
      assigneeIds: rule.assigneeIds,
      value: rule.value,
      priority: rule.priority,
      label: rule.label || "",
    });
  };

  const handleSubmit = async () => {
    if (!organizationId) {
      return;
    }

    try {
      if (editingRule) {
        await updatePricingRule.mutateAsync({
          id: editingRule.id,
          organizationId,
          data: form,
        });
        toast.success("Pricing rule updated");
      } else {
        await createPricingRule.mutateAsync({
          organizationId,
          data: form,
        });
        toast.success("Pricing rule created");
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pricing rule failed");
    }
  };

  const handleDelete = async (rule: PricingRule) => {
    if (!organizationId) {
      return;
    }

    await deletePricingRule.mutateAsync({
      id: rule.id,
      organizationId,
    });
    toast.success("Pricing rule deleted");
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            Dynamic Pricing
          </h2>
          <p className="text-muted-foreground">
            Manage peak prices and slow-period discounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingRule ? "Edit Rule" : "New Rule"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Tuesday afternoon discount"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm({ ...form, type: value as PRICING_RULE_TYPE })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRICING_RULE_TYPE.SLOW_PERIOD_DISCOUNT}>
                      Discount
                    </SelectItem>
                    <SelectItem value={PRICING_RULE_TYPE.PEAK_MULTIPLIER}>
                      Peak multiplier
                    </SelectItem>
                    <SelectItem value={PRICING_RULE_TYPE.FIXED_OVERRIDE}>
                      Fixed price
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(event) =>
                    setForm({ ...form, value: Number(event.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm({ ...form, startTime: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm({ ...form, endTime: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: Number(event.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={form.daysOfWeek.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        daysOfWeek: toggleArrayValue({
                          values: form.daysOfWeek,
                          value: day,
                        }),
                      })
                    }
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Services</Label>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <Button
                    key={service.id}
                    type="button"
                    variant={
                      form.serviceIds.includes(service.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        serviceIds: toggleArrayValue({
                          values: form.serviceIds,
                          value: service.id,
                        }),
                      })
                    }
                  >
                    {service.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Employees</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Button
                    key={member.id}
                    type="button"
                    variant={
                      form.assigneeIds.includes(member.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        assigneeIds: toggleArrayValue({
                          values: form.assigneeIds,
                          value: member.id,
                        }),
                      })
                    }
                  >
                    {member.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(event) =>
                  setForm({ ...form, label: event.target.value })
                }
                placeholder="Off-peak discount"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={form.active ? "default" : "outline"}
                size="sm"
                onClick={() => setForm({ ...form, active: !form.active })}
              >
                {form.active ? "Active" : "Inactive"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={!form.name || createPricingRule.isPending || updatePricingRule.isPending}
              >
                {editingRule ? "Save Rule" : "Create Rule"}
              </Button>
              {editingRule && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Pricing Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricingRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pricing rules yet.
              </p>
            ) : (
              <div className="space-y-3">
                {pricingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border rounded-lg p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.name}</p>
                        <span className="text-xs rounded-full border px-2 py-0.5">
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getRuleDescription(rule)} · {rule.startTime}-{rule.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.daysOfWeek.length
                          ? rule.daysOfWeek.join(", ")
                          : "Every day"}{" "}
                        · Priority {rule.priority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(rule)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(rule)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analyticsQuery.data?.insights.some(
        (insight) =>
          insight.type === ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD ||
          insight.type === ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD,
      ) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Pricing Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsQuery.data.insights
              .filter(
                (insight) =>
                  insight.type === ANALYTICS_INSIGHT_TYPE.UNDERBOOKED_PERIOD ||
                  insight.type === ANALYTICS_INSIGHT_TYPE.PEAK_PERIOD,
              )
              .map((insight) => (
                <div
                  key={insight.id}
                  className="border rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">{insight.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.recommendation}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => applyInsight(insight)}>
                    Use recommendation
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
