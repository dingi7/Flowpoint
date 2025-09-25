import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Invite, InviteStatus } from "@/core";
import { useInvitesByOrganization } from "@/hooks/repository-hooks/invite/use-invite";
import { useDeclineInvite } from "@/hooks/repository-hooks/invite/use-invite";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { format, addDays } from "date-fns";
import { 
  Mail, 
  Clock, 
  User, 
  Shield, 
  X, 
  CheckCircle, 
  XCircle,
  AlertCircle 
} from "lucide-react";
import { useState } from "react";

interface PendingInvitesListProps {
  searchQuery?: string;
}

export function PendingInvitesList({ searchQuery = "" }: PendingInvitesListProps) {
  const currentOrganizationId = useCurrentOrganizationId();
  const [decliningInviteId, setDecliningInviteId] = useState<string | null>(null);
  
  const {
    data: invites = [],
    isLoading,
    isError,
    refetch,
  } = useInvitesByOrganization(currentOrganizationId || "");

  const declineInviteMutation = useDeclineInvite();

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setDecliningInviteId(inviteId);
      await declineInviteMutation.mutateAsync({ inviteId });
      refetch();
    } catch (error) {
      console.error("Failed to decline invite:", error);
    } finally {
      setDecliningInviteId(null);
    }
  };

  // Filter invites based on search query
  const filteredInvites = invites.filter((invite) =>
    invite.inviteeEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group invites by status
  const pendingInvites = filteredInvites.filter(
    (invite) => invite.status === InviteStatus.PENDING
  );
  const acceptedInvites = filteredInvites.filter(
    (invite) => invite.status === InviteStatus.ACCEPTED
  );
  const declinedInvites = filteredInvites.filter(
    (invite) => invite.status === InviteStatus.DECLINED
  );

  const getStatusIcon = (status: InviteStatus) => {
    switch (status) {
      case InviteStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case InviteStatus.ACCEPTED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case InviteStatus.DECLINED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: InviteStatus) => {
    switch (status) {
      case InviteStatus.PENDING:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Pending</Badge>;
      case InviteStatus.ACCEPTED:
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
      case InviteStatus.DECLINED:
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const isExpired = (invite: Invite) => {
    if (!invite.validFor || !invite.createdAt) return false;
    const expiryDate = addDays(new Date(invite.createdAt), invite.validFor);
    return new Date() > expiryDate;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 animate-pulse" />
          Loading invites...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">Failed to load invites</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No invites found</p>
            <p className="text-xs text-muted-foreground">
              Invites will appear here when you send them to new members
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Pending Invites ({pendingInvites.length})</h3>
          </div>
          <div className="grid gap-4">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="border-yellow-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{invite.inviteeEmail}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Invited {format(new Date(invite.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(invite.status)}
                      {isExpired(invite) && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        <span>{invite.roleIds?.length || 0} roles assigned</span>
                      </div>
                      {invite.validFor && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Expires in {invite.validFor} days</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineInvite(invite.id)}
                      disabled={decliningInviteId === invite.id}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {decliningInviteId === invite.id ? "Declining..." : "Cancel Invite"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Invites */}
      {acceptedInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Accepted Invites ({acceptedInvites.length})</h3>
          </div>
          <div className="grid gap-4">
            {acceptedInvites.map((invite) => (
              <Card key={invite.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{invite.inviteeEmail}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Accepted {invite.updatedAt ? format(new Date(invite.updatedAt), "MMM d, yyyy 'at' h:mm a") : 'Recently'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(invite.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Declined Invites */}
      {declinedInvites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Declined Invites ({declinedInvites.length})</h3>
          </div>
          <div className="grid gap-4">
            {declinedInvites.map((invite) => (
              <Card key={invite.id} className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{invite.inviteeEmail}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Declined {invite.updatedAt ? format(new Date(invite.updatedAt), "MMM d, yyyy 'at' h:mm a") : 'Recently'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(invite.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
