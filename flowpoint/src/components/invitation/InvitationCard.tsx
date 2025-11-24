"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Invite, InviteStatus } from "@/core";
import { useDeclineInvite } from "@/hooks/repository-hooks/invite/use-invite";
import { useGetOrganizationById } from "@/hooks/repository-hooks/organization/use-organization";
import { addDays, format } from "date-fns";
import { Building, Calendar, Check, X } from "lucide-react";
import { useState } from "react";

interface InvitationCardProps {
  invitation: Invite;
  onAccept: (invitation: Invite) => void;
  onDecline?: (invitationId: string) => void;
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const [isDeclining, setIsDeclining] = useState(false);
  const declineInviteMutation = useDeclineInvite();

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrganization } =
    useGetOrganizationById(invitation.organizationId);

  // Calculate expiry date
  const expiryDate = addDays(
    new Date(invitation.createdAt),
    invitation.validFor || 7,
  );

  const handleDecline = async () => {
    if (isDeclining) return;

    setIsDeclining(true);
    try {
      await declineInviteMutation.mutateAsync({ inviteId: invitation.id });
      onDecline?.(invitation.id);
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleAccept = () => {
    onAccept(invitation);
  };

  const isActionable = invitation.status === InviteStatus.PENDING;

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="space-y-4">
        {/* Invitation Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Invited to organization:
            </span>
            <span className="font-medium text-xs bg-muted px-2 py-1 rounded">
              {isLoadingOrganization
                ? "Loading..."
                : organization?.name || invitation.organizationId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Expires on:</span>
            <span>{format(expiryDate, "MMM dd, yyyy 'at' h:mm a")}</span>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        {isActionable && (
          <div className="flex items-center gap-3">
            <Button onClick={handleAccept} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              Accept Invitation
            </Button>

            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isDeclining || declineInviteMutation.isPending}
              className="flex-1 gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
              {declineInviteMutation.isPending ? "Declining..." : "Decline"}
            </Button>
          </div>
        )}

        {!isActionable && invitation.status === InviteStatus.DECLINED && (
          <div className="text-center text-sm text-muted-foreground">
            This invitation has been declined
          </div>
        )}

        {!isActionable && invitation.status === InviteStatus.ACCEPTED && (
          <div className="text-center text-sm text-muted-foreground">
            This invitation has been accepted
          </div>
        )}
      </CardContent>
    </Card>
  );
}
