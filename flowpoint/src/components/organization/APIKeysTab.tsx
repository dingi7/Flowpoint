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
import { Organization } from "@/core";
import { useCreateApiKey, useRevokeApiKey } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import {
  convertFirestoreTimestampToDateWithFallback,
  normalizeApiKey,
} from "@/utils/date-time";
import { format } from "date-fns";
import {
  AlertTriangle,
  Check,
  Code,
  Copy,
  ExternalLink,
  Key,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface APIKeysTabProps {
  organization: Organization;
}

export function APIKeysTab({ organization }: APIKeysTabProps) {
  const { t } = useTranslation();
  const organizationId = useCurrentOrganizationId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [newlyCreatedApiKey, setNewlyCreatedApiKey] = useState<string | null>(
    null,
  );
  const [copiedInModal, setCopiedInModal] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState<typeof organization.apiKeys>(
    organization.apiKeys || [],
  );

  const createApiKeyMutation = useCreateApiKey();
  const revokeApiKeyMutation = useRevokeApiKey();

  // Sync localApiKeys with organization prop when it changes
  useEffect(() => {
    setLocalApiKeys(organization.apiKeys || []);
  }, [organization.apiKeys]);

  // Merge organization apiKeys with local state
  const apiKeys = localApiKeys;

  const handleCreateApiKey = async () => {
    if (!apiKeyName.trim()) {
      toast.error(t("organization.apiKeys.errors.nameRequired"));
      return;
    }

    if (!organizationId) {
      toast.error(t("organization.apiKeys.errors.organizationIdRequired"));
      return;
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        organizationId,
        name: apiKeyName.trim(),
      });

      // Add to local API keys list (normalize the createdAt field)
      setLocalApiKeys((prev) => [
        ...prev,
        normalizeApiKey(result.apiKeyMetadata),
      ]);

      // Store the newly created API key and show success modal
      setNewlyCreatedApiKey(result.apiKey);
      setApiKeyName("");
      setIsCreateDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error(t("organization.apiKeys.errors.createError"));
    }
  };

  const handleCopyApiKeyFromModal = () => {
    if (newlyCreatedApiKey) {
      navigator.clipboard.writeText(newlyCreatedApiKey);
      setCopiedInModal(true);
      toast.success(t("organization.apiKeys.errors.copySuccess"));
      setTimeout(() => setCopiedInModal(false), 2000);
    }
  };

  const handleRevokeClick = (secretId: string) => {
    setRevokingKeyId(secretId);
    setIsRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!revokingKeyId || !organizationId) {
      return;
    }

    try {
      await revokeApiKeyMutation.mutateAsync({
        organizationId,
        secretId: revokingKeyId,
      });

      // Optimistically update the local API keys list to mark as revoked
      setLocalApiKeys((prev) =>
        prev.map((key) =>
          key.secretId === revokingKeyId
            ? { ...key, status: "revoked" as const }
            : key,
        ),
      );

      toast.success(t("organization.apiKeys.errors.revokeSuccess"));
      setIsRevokeDialogOpen(false);
      setRevokingKeyId(null);
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error(t("organization.apiKeys.errors.revokeError"));
    }
  };

  return (
    <>
    {/* SDK Instructions Card */}
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {t("organization.sdk.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("organization.sdk.description")}
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t("organization.sdk.step1")}
              </h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">
                  {`<script src="https://flowpoint-sdk.web.app/sdk.js"></script>`}
                </code>
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">
                {t("organization.sdk.step2")}
              </h4>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">{`const config = {
  organizationId: "${organizationId || "YOUR_ORGANIZATION_ID"}",
  target: "#crm-form-container",
};

window.flowpoint.renderForm(config);`}</code>
              </pre>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 border">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">
                {t("organization.sdk.note")}
              </strong>{" "}
              {t("organization.sdk.noteDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t("organization.apiKeys.title")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() =>
                  window.open("https://docs.flowpoint.services", "_blank")
                }
                className="gap-2"
                variant="outline"
              >
                <ExternalLink className="h-4 w-4" />
                {t("organization.apiKeys.apiDocumentation")}
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
                variant="default"
              >
                <Plus className="h-4 w-4" />
                {t("organization.apiKeys.createApiKey")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {t("organization.apiKeys.noApiKeys")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("organization.apiKeys.tableHeaders.name")}
                  </TableHead>
                  <TableHead>
                    {t("organization.apiKeys.tableHeaders.apiKey")}
                  </TableHead>
                  <TableHead>
                    {t("organization.apiKeys.tableHeaders.status")}
                  </TableHead>
                  <TableHead>
                    {t("organization.apiKeys.tableHeaders.created")}
                  </TableHead>
                  <TableHead>
                    {t("organization.apiKeys.tableHeaders.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => {
                  return (
                    <TableRow key={apiKey.secretId}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <span className="text-muted-foreground">
                          ••••{apiKey.lastFour}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            apiKey.status === "active"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {apiKey.status === "active"
                            ? t("organization.apiKeys.status.active")
                            : t("organization.apiKeys.status.revoked")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          try {
                            const date =
                              convertFirestoreTimestampToDateWithFallback(
                                apiKey.createdAt,
                              );
                            return format(date, "MMM dd, yyyy HH:mm");
                          } catch (error) {
                            console.error(
                              "Error formatting date:",
                              error,
                              apiKey.createdAt,
                            );
                            return format(new Date(), "MMM dd, yyyy HH:mm");
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {apiKey.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeClick(apiKey.secretId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("organization.apiKeys.createDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("organization.apiKeys.createDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKeyName">
                {t("organization.apiKeys.createDialog.name")}
              </Label>
              <Input
                id="apiKeyName"
                placeholder={t(
                  "organization.apiKeys.createDialog.namePlaceholder",
                )}
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateApiKey();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setApiKeyName("");
                }}
              >
                {t("organization.apiKeys.createDialog.cancel")}
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={!apiKeyName.trim() || createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending
                  ? t("organization.apiKeys.createDialog.creating")
                  : t("organization.apiKeys.createDialog.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("organization.apiKeys.successDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("organization.apiKeys.successDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 border border-destructive/50">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  {t("organization.apiKeys.successDialog.important")}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("organization.apiKeys.successDialog.importantDescription")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKeyValue">
                {t("organization.apiKeys.successDialog.apiKey")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKeyValue"
                  readOnly
                  value={newlyCreatedApiKey || ""}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyApiKeyFromModal}
                  className="shrink-0"
                  title={t("organization.apiKeys.successDialog.apiKey")}
                >
                  {copiedInModal ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsSuccessDialogOpen(false);
                  setNewlyCreatedApiKey(null);
                  setCopiedInModal(false);
                }}
              >
                {t("organization.apiKeys.successDialog.copied")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Confirmation Dialog */}
      <AlertDialog
        open={isRevokeDialogOpen}
        onOpenChange={setIsRevokeDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organization.apiKeys.revokeDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organization.apiKeys.revokeDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRevokeDialogOpen(false);
                setRevokingKeyId(null);
              }}
            >
              {t("organization.apiKeys.revokeDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={revokeApiKeyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeApiKeyMutation.isPending
                ? t("organization.apiKeys.revokeDialog.revoking")
                : t("organization.apiKeys.revokeDialog.revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
    </>
  );
}
