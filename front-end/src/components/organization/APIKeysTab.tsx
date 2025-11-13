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
import { Organization } from "@/core";
import { useCreateApiKey, useRevokeApiKey } from "@/hooks";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { Key, Plus, Copy, Check, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { convertFirestoreTimestampToDate } from "@/utils/date-time";

interface APIKeysTabProps {
  organization: Organization;
}

export function APIKeysTab({ organization }: APIKeysTabProps) {
  const organizationId = useCurrentOrganizationId();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  // Store full API keys by secretId (since ApiKey schema only has lastFour)
  const [apiKeysMap, setApiKeysMap] = useState<Record<string, string>>({});
  const [localApiKeys, setLocalApiKeys] = useState<typeof organization.apiKeys>(organization.apiKeys || []);

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
      toast.error("Please enter a name for the API key");
      return;
    }

    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        organizationId,
        name: apiKeyName.trim(),
      });
      
      // Store the full API key in the map
      setApiKeysMap((prev) => ({
        ...prev,
        [result.apiKeyMetadata.secretId]: result.apiKey,
      }));
      
      // Add to local API keys list
      setLocalApiKeys((prev) => [...prev, result.apiKeyMetadata]);
      
      setApiKeyName("");
      setIsCreateDialogOpen(false);
      toast.success("API key created successfully");
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Failed to create API key");
    }
  };

  const handleCopyApiKey = (apiKey: string, secretId: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKeyId(secretId);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKeyId(null), 2000);
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
      
      // Remove from apiKeysMap since it's revoked
      setApiKeysMap((prev) => {
        const newMap = { ...prev };
        delete newMap[revokingKeyId];
        return newMap;
      });
      
      toast.success("API key revoked successfully");
      setIsRevokeDialogOpen(false);
      setRevokingKeyId(null);
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error("Failed to revoke API key");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              variant="default"
            >
              <Plus className="h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No API keys created yet. Create your first API key to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => {
                  const fullApiKey = apiKeysMap[apiKey.secretId];
                  return (
                    <TableRow key={apiKey.secretId}>
                      <TableCell className="font-medium">{apiKey.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {fullApiKey ? (
                          fullApiKey
                        ) : (
                          <span className="text-muted-foreground">
                            ••••{apiKey.lastFour}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            apiKey.status === "active" ? "default" : "destructive"
                          }
                        >
                          {apiKey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const date = convertFirestoreTimestampToDate(apiKey.createdAt);
                          return date
                            ? format(date, "MMM dd, yyyy HH:mm")
                            : "Invalid date";
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {fullApiKey && apiKey.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyApiKey(fullApiKey, apiKey.secretId)}
                            >
                              {copiedKeyId === apiKey.secretId ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKeyName">Name</Label>
              <Input
                id="apiKeyName"
                placeholder="e.g., Production API Key"
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
                Cancel
              </Button>
              <Button
                onClick={handleCreateApiKey}
                disabled={!apiKeyName.trim() || createApiKeyMutation.isPending}
              >
                {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Confirmation Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
              The key will immediately stop working and cannot be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRevokeDialogOpen(false);
                setRevokingKeyId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={revokeApiKeyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeApiKeyMutation.isPending ? "Revoking..." : "Revoke API Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

