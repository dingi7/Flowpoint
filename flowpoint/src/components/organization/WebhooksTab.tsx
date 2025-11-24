"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WEBHOOK_EVENT_TYPE, WebhookSubscription } from "@/core";
import {
  useCreateWebhookSubscription,
  useRemoveWebhookSubscription,
  useWebhookSubscriptions,
} from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { convertFirestoreTimestampToDateWithFallback } from "@/utils/date-time";
import { format } from "date-fns";
import { Eye, Plus, Trash2, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WEBHOOK_EVENT_OPTIONS = [
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_CREATED, label: "Customer Created" },
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_UPDATED, label: "Customer Updated" },
  { value: WEBHOOK_EVENT_TYPE.CUSTOMER_DELETED, label: "Customer Deleted" },
  {
    value: WEBHOOK_EVENT_TYPE.APPOINTMENT_CREATED,
    label: "Appointment Created",
  },
  {
    value: WEBHOOK_EVENT_TYPE.APPOINTMENT_UPDATED,
    label: "Appointment Updated",
  },
  {
    value: WEBHOOK_EVENT_TYPE.APPOINTMENT_DELETED,
    label: "Appointment Deleted",
  },
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] =
    useState<WebhookSubscription | null>(null);
  const [webhookToDelete, setWebhookToDelete] =
    useState<WebhookSubscription | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // Fetch webhook subscriptions from repository
  const { data: webhookSubscriptionsData, isLoading } = useWebhookSubscriptions(
    {
      orderBy: {
        field: "createdAt",
        direction: "desc",
      },
    },
  );

  // Flatten paginated data
  const webhookSubscriptions = webhookSubscriptionsData?.pages.flat() || [];

  const createWebhookSubscriptionMutation = useCreateWebhookSubscription();
  const removeWebhookSubscriptionMutation = useRemoveWebhookSubscription();

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
        `Failed to create webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleEventTypeChange = (
    eventType: string,
    checked: boolean | "indeterminate",
  ) => {
    if (checked === true) {
      setSelectedEventTypes((prev) =>
        prev.includes(eventType) ? prev : [...prev, eventType],
      );
    } else {
      setSelectedEventTypes((prev) =>
        prev.filter((type) => type !== eventType),
      );
    }
  };

  const handleViewDetails = (subscription: WebhookSubscription) => {
    setSelectedWebhook(subscription);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteClick = (subscription: WebhookSubscription) => {
    setWebhookToDelete(subscription);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!webhookToDelete || !organizationId) {
      return;
    }

    try {
      await removeWebhookSubscriptionMutation.mutateAsync({
        organizationId,
        subscriptionId: webhookToDelete.id,
      });
      toast.success("Webhook subscription removed successfully");
      setIsDeleteDialogOpen(false);
      setWebhookToDelete(null);
    } catch (error) {
      console.error("Failed to remove webhook subscription:", error);
      toast.error(
        `Failed to remove webhook subscription: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
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
              <p className="text-muted-foreground">
                Loading webhook subscriptions...
              </p>
            </div>
          ) : webhookSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No webhook subscriptions created yet. Create your first webhook
                to receive real-time event notifications.
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
                          subscription.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          const date =
                            convertFirestoreTimestampToDateWithFallback(
                              subscription.createdAt,
                            );
                          return format(date, "MMM dd, yyyy HH:mm");
                        } catch (error) {
                          console.error(
                            "Error formatting date:",
                            error,
                            subscription.createdAt,
                          );
                          return format(new Date(), "MMM dd, yyyy HH:mm");
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(subscription)}
                          title="View webhook details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(subscription)}
                          title="Delete webhook subscription"
                          disabled={removeWebhookSubscriptionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
              Set up a webhook to receive real-time notifications when events
              occur in your organization.
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
                The URL where webhook events will be sent. Must be a valid HTTPS
                URL.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Event Types</Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {WEBHOOK_EVENT_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={option.value}
                        checked={selectedEventTypes.includes(option.value)}
                        onCheckedChange={(checked) =>
                          handleEventTypeChange(option.value, checked)
                        }
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
                Select one or more event types to subscribe to. You'll receive
                notifications for all selected events.
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
                      selectedWebhook.status === "active"
                        ? "default"
                        : "secondary"
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
                    <p className="text-sm text-muted-foreground">
                      No event types
                    </p>
                  ) : (
                    selectedWebhook.eventTypes.map((eventType) => (
                      <Badge
                        key={eventType}
                        variant="outline"
                        className="text-xs"
                      >
                        {WEBHOOK_EVENT_OPTIONS.find(
                          (opt) => opt.value === eventType,
                        )?.label || eventType}
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
                      const date = convertFirestoreTimestampToDateWithFallback(
                        selectedWebhook.createdAt,
                      );
                      return format(date, "MMM dd, yyyy HH:mm");
                    } catch (error) {
                      console.error(
                        "Error formatting date:",
                        error,
                        selectedWebhook.createdAt,
                      );
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
                      const date = convertFirestoreTimestampToDateWithFallback(
                        selectedWebhook.updatedAt,
                      );
                      return format(date, "MMM dd, yyyy HH:mm");
                    } catch (error) {
                      console.error(
                        "Error formatting date:",
                        error,
                        selectedWebhook.updatedAt,
                      );
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

      {/* Delete Webhook Subscription Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this webhook subscription? This
              action cannot be undone.
              {webhookToDelete && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-sm font-mono text-xs break-all">
                    {webhookToDelete.callbackUrl}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setWebhookToDelete(null);
              }}
              disabled={removeWebhookSubscriptionMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={removeWebhookSubscriptionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeWebhookSubscriptionMutation.isPending
                ? "Deleting..."
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
