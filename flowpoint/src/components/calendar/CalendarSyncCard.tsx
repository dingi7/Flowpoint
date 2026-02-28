import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCalendarSyncStatus,
  useDisconnectCalendarSync,
  useStartGoogleConnect,
  useToggleCalendarSync,
} from "@/hooks";
import { Copy, Link2, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CalendarSyncCardProps {
  organizationId: string;
  selectedMemberId: string;
  currentUserId: string | null;
}

export function CalendarSyncCard({
  organizationId,
  selectedMemberId,
  currentUserId,
}: CalendarSyncCardProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isSelf = !!currentUserId && selectedMemberId === currentUserId;

  const statusQuery = useCalendarSyncStatus(isSelf ? organizationId : undefined);
  const startGoogleConnect = useStartGoogleConnect();
  const toggleAutoSync = useToggleCalendarSync();
  const disconnectSync = useDisconnectCalendarSync();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const calendarSync = params.get("calendarSync");
    const reason = params.get("calendarSyncReason");

    if (!calendarSync) {
      return;
    }

    if (calendarSync === "success") {
      toast.success(t("calendar.sync.connectSuccess"));
    } else {
      toast.error(
        `${t("calendar.sync.connectError")}${reason ? `: ${reason}` : ""}`,
      );
    }

    params.delete("calendarSync");
    params.delete("calendarSyncReason");
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, t]);

  const handleConnect = async () => {
    try {
      const result = await startGoogleConnect.mutateAsync({
        organizationId,
        returnUrl: window.location.href,
      });
      window.location.href = result.authUrl;
    } catch (error) {
      toast.error(
        `${t("calendar.sync.connectError")}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      await toggleAutoSync.mutateAsync({
        organizationId,
        enabled,
      });
      toast.success(
        enabled
          ? t("calendar.sync.enabledSuccess")
          : t("calendar.sync.disabledSuccess"),
      );
    } catch (error) {
      toast.error(
        `${t("calendar.sync.toggleError")}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSync.mutateAsync({
        organizationId,
      });
      toast.success(t("calendar.sync.disconnectSuccess"));
    } catch (error) {
      toast.error(
        `${t("calendar.sync.disconnectError")}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleCopyIcsUrl = async (url?: string) => {
    if (!url) {
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success(t("calendar.sync.copyIcsSuccess"));
  };

  if(!isSelf) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("calendar.sync.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSelf ? (
          <p className="text-sm text-muted-foreground">
            {t("calendar.sync.selfOnlyMessage")}
          </p>
        ) : statusQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("calendar.sync.loading")}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t("calendar.sync.description")}
            </p>

            {statusQuery.data?.connected && (
              <div className="space-y-2">
                {statusQuery.data.googleAccountEmail && (
                  <p className="text-sm">
                    {t("calendar.sync.connectedAs")}:{" "}
                    <span className="font-medium">
                      {statusQuery.data.googleAccountEmail}
                    </span>
                  </p>
                )}

                <p className="text-sm">
                  {t("calendar.sync.backfillStatus")}:{" "}
                  <span className="font-medium">
                    {t(`calendar.sync.backfill.${statusQuery.data.backfillStatus}`)}
                  </span>
                </p>

                {statusQuery.data.lastError ? (
                  <p className="text-sm text-destructive">
                    {statusQuery.data.lastError}
                  </p>
                ) : null}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="calendar-sync-enabled"
                    checked={statusQuery.data.syncEnabled}
                    onCheckedChange={handleToggle}
                    disabled={toggleAutoSync.isPending}
                  />
                  <Label htmlFor="calendar-sync-enabled">
                    {t("calendar.sync.autoSyncToggle")}
                  </Label>
                </div>
              </div>
            )}

            {!statusQuery.data?.connected ? (
              <Button
                onClick={handleConnect}
                disabled={startGoogleConnect.isPending}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                {statusQuery.data?.status === "reauth_required"
                  ? t("calendar.sync.reconnectGoogle")
                  : t("calendar.sync.connectGoogle")}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleCopyIcsUrl(statusQuery.data?.appleIcsUrl)}
                  disabled={!statusQuery.data?.appleIcsUrl}
                >
                  <Copy className="h-4 w-4" />
                  {t("calendar.sync.copyIcs")}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    statusQuery.data?.appleIcsUrl &&
                    window.open(statusQuery.data.appleIcsUrl, "_blank")
                  }
                  disabled={!statusQuery.data?.appleIcsUrl}
                >
                  <Link2 className="h-4 w-4" />
                  {t("calendar.sync.openIcs")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectSync.isPending}
                >
                  {t("calendar.sync.disconnect")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
