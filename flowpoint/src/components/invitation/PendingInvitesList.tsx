import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Invite, InviteStatus } from "@/core";
import {
  useDeclineInvite,
  useInvitesByOrganization,
} from "@/hooks/repository-hooks/invite/use-invite";
import { useRoles } from "@/hooks/repository-hooks/role/use-role";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { addDays, format } from "date-fns";
import { AlertCircle, Clock, Mail, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface PendingInvitesListProps {
  searchQuery?: string;
}

export function PendingInvitesList({
  searchQuery = "",
}: PendingInvitesListProps) {
  const { t } = useTranslation();
  const currentOrganizationId = useCurrentOrganizationId();
  const [decliningInviteId, setDecliningInviteId] = useState<string | null>(
    null,
  );

  const {
    data: invites = [],
    isLoading,
    isError,
    refetch,
  } = useInvitesByOrganization(currentOrganizationId || "");

  // Fetch roles for display
  const { data: rolesData } = useRoles({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const roles = rolesData || [];
  const roleMap = new Map(roles.map((role) => [role.id, role]));

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
    invite.inviteeEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: InviteStatus, isExpired: boolean) => {
    if (isExpired && status === InviteStatus.PENDING) {
      return <Badge variant="destructive">{t("team.invitation.list.status.expired")}</Badge>;
    }

    switch (status) {
      case InviteStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200"
          >
            {t("team.invitation.list.status.pending")}
          </Badge>
        );
      case InviteStatus.ACCEPTED:
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {t("team.invitation.list.status.accepted")}
          </Badge>
        );
      case InviteStatus.DECLINED:
        return <Badge variant="destructive">{t("team.invitation.list.status.declined")}</Badge>;
      default:
        return <Badge variant="secondary">{t("team.invitation.list.status.unknown")}</Badge>;
    }
  };

  const isExpired = (invite: Invite) => {
    if (!invite.validFor || !invite.createdAt) return false;
    const expiryDate = addDays(new Date(invite.createdAt), invite.validFor);
    return new Date() > expiryDate;
  };

  const getDaysLeft = (invite: Invite) => {
    if (!invite.validFor || !invite.createdAt) return null;
    const created = new Date(invite.createdAt);
    const expiryDate = addDays(created, invite.validFor);
    const now = new Date();
    return Math.max(
      0,
      Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  };

  const getInviteRoles = (roleIds: string[]) => {
    return roleIds
      .map((roleId) => roleMap.get(roleId))
      .filter((role): role is NonNullable<typeof role> => Boolean(role));
  };

  const getInitials = (email: string) => {
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 animate-pulse" />
          {t("team.invitation.list.loading")}
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
            <p className="text-sm text-destructive">{t("team.invitation.list.failedToLoad")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              {t("team.invitation.list.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("team.invitation.list.noInvites")}</p>
          <p className="text-xs text-muted-foreground">
            {t("team.invitation.list.noInvitesDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("team.invitation.list.invites")} ({filteredInvites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("team.invitation.list.tableHeaders.invitee")}</TableHead>
              <TableHead>{t("team.invitation.list.tableHeaders.status")}</TableHead>
              <TableHead>{t("team.invitation.list.tableHeaders.roles")}</TableHead>
              <TableHead>{t("team.invitation.list.tableHeaders.created")}</TableHead>
              <TableHead>{t("team.invitation.list.tableHeaders.expires")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvites.map((invite) => {
              const expired = isExpired(invite);
              const daysLeft = getDaysLeft(invite);
              const inviteRoles = getInviteRoles(invite.roleIds || []);

              return (
                <TableRow key={invite.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-muted/20 hover:ring-primary/20 transition-all duration-200">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                          {getInitials(invite.inviteeEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invite.inviteeEmail}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {t("team.invitation.list.invitedMember")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invite.status, expired)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {inviteRoles.map((role) => (
                        <Badge
                          key={role.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {role.name}
                        </Badge>
                      ))}
                      {(!invite.roleIds || invite.roleIds.length === 0) && (
                        <span className="text-sm text-muted-foreground">
                          {t("team.invitation.list.noRolesAssigned")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invite.createdAt
                      ? format(new Date(invite.createdAt), "MMM d, yyyy")
                      : t("common.notAvailable")}
                  </TableCell>
                  <TableCell>
                    {invite.validFor && invite.createdAt ? (
                      expired ? (
                        <span className="text-sm text-destructive">
                          {t("team.invitation.list.expired")}
                        </span>
                      ) : daysLeft !== null ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {daysLeft} {daysLeft !== 1 ? t("team.invitation.list.daysLeftPlural") : t("team.invitation.list.daysLeft")}
                        </div>
                      ) : (
                        t("common.notAvailable")
                      )
                    ) : (
                      t("common.notAvailable")
                    )}
                  </TableCell>
                  <TableCell>
                    {invite.status === InviteStatus.PENDING && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("team.invitation.list.actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeclineInvite(invite.id)}
                            disabled={decliningInviteId === invite.id}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {decliningInviteId === invite.id
                              ? t("team.invitation.list.declining")
                              : t("team.invitation.list.cancelInvite")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredInvites.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t("team.invitation.list.noResults")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
