"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { WEBHOOK_EVENT_TYPE, WebhookSubscription } from "@/core";
import { useCreateWebhookSubscription, useWebhookSubscriptions } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Webhook, Plus, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { convertFirestoreTimestampToDateWithFallback } from "@/utils/date-time";

const WEBHOOK_EVENT_OPTIONS = [
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_CREATED, label: "Customer Created" },
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_UPDATED, label: "Customer Updated" },
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_DELETED, label: "Customer Deleted" },
  { value: WEBHOOK_EVENT_TYPE.APPOINTMENT_CREATED, label: "Appointment Created" },
  { value: WEBHOOK_EVENT_TYPE.APPOINTMENT_UPDATED, label: "Appointment Updated" },
  { value: WEBHOOK_EVENT_TYPE.APPOINTMENT_DELETED, label: "Appointment Deleted" },
  { value: WEBHOOK_EVENT_TYPE.SERVICE_CREATED, label: "Service Created" },
  { value: WEBHOOK_EVENT_TYPE.SERVICE_UPDATED, label: "Service Updated" },
  { value: WEBHOOK_EVENT_TYPE.SERVICE_DELETED, label: "Service Deleted" },
  { value: WEBHOOK_EVENT_TYPE.MEMBER_CREATED, label: "Member Created" },
  { value: WEBHOOK_EVENT_TYPE.MEMBER_UPDATED, label: "Member Updated" },
  { value: WEBHOOK_EVENT_TYPE.MEMBER_DELETED, label: "Member Deleted" },
  { value: WEBHOOK_EVENT_TYPE.INVITE_CREATED, label: "Invite Created" },
  { value: WEBHOOK_EVENT_TYPE.INVITE_UPDATED, label: "Invite Updated" },
  { value: WEBHOOK_EVENT_TYPE.INVITE_DELETED, label: "Invite Deleted" },
];

export function WebhooksTab() {
  const organizationId = useCurrentOrganizationId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookSubscription | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  
  // Fetch webhook subscriptions from repository
  const { data: webhookSubscriptionsData, isLoading } = useWebhookSubscriptions({
    orderBy: {
      field: "createdAt",
      direction: "desc",
    },
  });
  
  // Flatten paginated data
  const webhookSubscriptions = webhookSubscriptionsData?.pages.flat() || [];

  const createWebhookSubscriptionMutation = useCreateWebhookSubscription();

  const handleCreateWebhookSubscription = async () => {
    console.log("handleCreateWebhookSubscription called", {
      callbackUrl,
      selectedEventTypes,
      organizationId,
    });

    if (!callbackUrl.trim()) {
      toast.error("Please enter a callback URL");
      return;
    }

    if (selectedEventTypes.length === 0) {
      toast.error("Please select at least one event type");
      return;
    }

    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    // Validate URL
    try {
      new URL(callbackUrl.trim());
    } catch (error) {
      console.error("URL validation error:", error);
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      console.log("Calling mutateAsync with:", {
        organizationId,
        eventTypes: selectedEventTypes,
        callbackUrl: callbackUrl.trim(),
      });
      
      const result = await createWebhookSubscriptionMutation.mutateAsync({
        organizationId,
        eventTypes: selectedEventTypes,
        callbackUrl: callbackUrl.trim(),
      });
      
      console.log("Mutation successful:", result);
      
      setCallbackUrl("");
      setSelectedEventTypes([]);
      setIsCreateDialogOpen(false);
      toast.success("Webhook subscription created successfully");
    } catch (error) {
      console.error("Failed to create webhook subscription:", error);
      toast.error(
        `Failed to create webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleEventTypeChange = (eventType: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedEventTypes((prev) =>
        prev.includes(eventType) ? prev : [...prev, eventType]
      );
    } else {
      setSelectedEventTypes((prev) =>
        prev.filter((type) => type !== eventType)
      );
    }
  };

  const handleViewDetails = (subscription: WebhookSubscription) => {
    setSelectedWebhook(subscription);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Subscriptions
            </CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading webhook subscriptions...</p>
            </div>
          ) : webhookSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No webhook subscriptions created yet. Create your first webhook to receive real-time event notifications.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Callback URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-mono text-xs">
                      {subscription.callbackUrl}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          subscription.status === "active" ? "default" : "secondary"
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          const date = convertFirestoreTimestampToDateWithFallback(subscription.createdAt);
                          return format(date, "MMM dd, yyyy HH:mm");
                        } catch (error) {
                          console.error("Error formatting date:", error, subscription.createdAt);
                          return format(new Date(), "MMM dd, yyyy HH:mm");
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(subscription)}
                        title="View webhook details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Webhook Subscription Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook Subscription</DialogTitle>
            <DialogDescription>
              Set up a webhook to receive real-time notifications when events occur in your organization.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateWebhookSubscription();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="callbackUrl">Callback URL</Label>
              <Input
                id="callbackUrl"
                type="url"
                placeholder="https://your-server.com/webhook"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target === e.currentTarget) {
                    e.preventDefault();
                    handleCreateWebhookSubscription();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                The URL where webhook events will be sent. Must be a valid HTTPS URL.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Event Types</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {WEBHOOK_EVENT_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={selectedEventTypes.includes(option.value)}
                        onCheckedChange={(checked) => handleEventTypeChange(option.value, checked)}
                      />
                      <Label
                        htmlFor={option.value}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more event types to subscribe to. You'll receive notifications for all selected events.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setCallbackUrl("");
                  setSelectedEventTypes([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !callbackUrl.trim() ||
                  selectedEventTypes.length === 0 ||
                  createWebhookSubscriptionMutation.isPending
                }
              >
                {createWebhookSubscriptionMutation.isPending
                  ? "Creating..."
                  : "Create Webhook"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Webhook Details Dialog */}
      <Dialog 
        open={isDetailsDialogOpen} 
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
            setSelectedWebhook(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Subscription Details</DialogTitle>
            <DialogDescription>
              View details of your webhook subscription.
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Callback URL</Label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {selectedWebhook.callbackUrl}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  <Badge
                    variant={
                      selectedWebhook.status === "active" ? "default" : "secondary"
                    }
                  >
                    {selectedWebhook.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Types</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {selectedWebhook.eventTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No event types</p>
                  ) : (
                    selectedWebhook.eventTypes.map((eventType) => (
                      <Badge key={eventType} variant="outline" className="text-xs">
                        {WEBHOOK_EVENT_OPTIONS.find((opt) => opt.value === eventType)?.label || eventType}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Created</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {(() => {
                    try {
                      const date = convertFirestoreTimestampToDateWithFallback(selectedWebhook.createdAt);
                      return format(date, "MMM dd, yyyy HH:mm");
                    } catch (error) {
                      console.error("Error formatting date:", error, selectedWebhook.createdAt);
                      return format(new Date(), "MMM dd, yyyy HH:mm");
                    }
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {(() => {
                    try {
                      const date = convertFirestoreTimestampToDateWithFallback(selectedWebhook.updatedAt);
                      return format(date, "MMM dd, yyyy HH:mm");
                    } catch (error) {
                      console.error("Error formatting date:", error, selectedWebhook.updatedAt);
                      return format(new Date(), "MMM dd, yyyy HH:mm");
                    }
                  })()}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

