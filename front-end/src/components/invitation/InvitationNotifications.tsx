"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Invite, InviteStatus } from "@/core";
import { useInvitesByEmail } from "@/hooks";
import { useUser } from "@clerk/clerk-react";
import { InvitationCard } from "./InvitationCard";
import { InvitationAcceptanceModal } from "./InvitationAcceptanceModal";
import { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";

export function InvitationNotifications() {
  const { user } = useUser();
  const [selectedInvitation, setSelectedInvitation] = useState<Invite | null>(null);
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);

  const {
    data: invitations = [],
    isLoading,
    isError,
    refetch,
    error
  } = useInvitesByEmail(user?.primaryEmailAddress?.emailAddress || "");

  console.log(error)

  const handleAcceptInvitation = (invitation: Invite) => {
    setSelectedInvitation(invitation);
    setIsAcceptanceModalOpen(true);
  };

  const handleAcceptanceSuccess = () => {
    refetch();
    setSelectedInvitation(null);
    setIsAcceptanceModalOpen(false);
  };

  const handleDeclineSuccess = () => {
    refetch();
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === InviteStatus.PENDING
  );

  const processedInvitations = invitations.filter(
    (inv) => inv.status !== InviteStatus.PENDING
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 animate-pulse" />
          Loading invitations...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load invitations. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-sm text-muted-foreground">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No invitations found
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-80">
        <div className="p-2 space-y-3">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground px-2">
                <Mail className="h-4 w-4" />
                Pending Invitations ({pendingInvitations.length})
              </div>
              {invitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineSuccess}
                />
              ))}
            </div>
          )}

          {/* Processed Invitations */}
          {processedInvitations.length > 0 && (
            <div className="space-y-2">
              {pendingInvitations.length > 0 && (
                <div className="border-t pt-3 mt-3" />
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
                <CheckCircle className="h-4 w-4" />
                Recent Activity ({processedInvitations.length})
              </div>
              {processedInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineSuccess}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Acceptance Modal */}
      <InvitationAcceptanceModal
        invitation={selectedInvitation}
        isOpen={isAcceptanceModalOpen}
        onClose={() => {
          setIsAcceptanceModalOpen(false);
          setSelectedInvitation(null);
        }}
        onSuccess={handleAcceptanceSuccess}
      />
    </>
  );
}