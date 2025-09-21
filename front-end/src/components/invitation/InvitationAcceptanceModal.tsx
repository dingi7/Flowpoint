"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Invite } from "@/core";
import { useAcceptOrganizationInvite } from "@/hooks/service-hooks/invite/use-accept-invite";
import { useMemberImageUpload } from "@/hooks/service-hooks/media/use-member-image-upload";
import { Building, User, AlertCircle, Loader2, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const acceptanceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
});

type AcceptanceFormData = z.infer<typeof acceptanceFormSchema>;

interface InvitationAcceptanceModalProps {
  invitation: Invite | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InvitationAcceptanceModal({
  invitation,
  isOpen,
  onClose,
  onSuccess,
}: InvitationAcceptanceModalProps) {
  const [error, setError] = useState<string | null>(null);
  const acceptInviteMutation = useAcceptOrganizationInvite();
  const imageUpload = useMemberImageUpload();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AcceptanceFormData>({
    resolver: zodResolver(acceptanceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
    },
  });

  const handleImageUpload = (file: File) => {
    // Clear any previous errors when starting a new upload
    setError(null);
    imageUpload.uploadFile(file);
  };

  const handleImageRemove = () => {
    setValue("image", "");
    // Clear any upload-related errors when removing image
    setError(null);
  };

  // Update image field when upload completes
  React.useEffect(() => {
    if (imageUpload.isComplete && imageUpload.url) {
      setValue("image", imageUpload.url);
    }
  }, [imageUpload.isComplete, imageUpload.url, setValue]);

  // Set error when upload fails
  React.useEffect(() => {
    if (imageUpload.error) {
      setError(imageUpload.error.message || "Failed to upload image");
    }
  }, [imageUpload.error]);

  const onSubmit = async (data: AcceptanceFormData) => {
    if (!invitation) return;

    try {
      setError(null);
      await acceptInviteMutation.mutateAsync({
        inviteId: invitation.id,
        name: data.name,
        description: data.description,
        image: data.image,
      });
      
      reset();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  if (!invitation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Accept Organization Invitation
          </DialogTitle>
          <DialogDescription>
            Complete your profile to join the organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* User Details Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-none">
              <CardHeader>
                <CardTitle className="text-lg font-sans flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This is how your name will appear to other members
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tell us a bit about yourself and your role..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    A brief description about yourself and your role in the organization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Profile Image (Optional)</Label>
                  {watch("image") ? (
                    <div className="relative">
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200 transition-all duration-200">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted ring-2 ring-green-200">
                          <img
                            src={watch("image")}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Image uploaded successfully</p>
                          <p className="text-xs text-green-600">Ready to use</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleImageRemove}
                          disabled={isSubmitting}
                          className="hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                            // Clear the input value to allow re-uploading the same file
                            e.target.value = '';
                          }}
                          disabled={isSubmitting || imageUpload.isLoading}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer flex flex-col items-center gap-2 transition-colors duration-200 ${
                            isSubmitting || imageUpload.isLoading 
                              ? 'cursor-not-allowed opacity-50' 
                              : 'hover:text-blue-600'
                          }`}
                        >
                          {imageUpload.isLoading ? (
                            <div className="w-full space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                                <p className="text-sm font-medium text-blue-600">
                                  Uploading... {Math.round(imageUpload.uploadProgress)}%
                                </p>
                              </div>
                              <Progress 
                                value={imageUpload.uploadProgress} 
                                className="w-full h-2"
                              />
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload an image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add a profile picture to help others recognize you
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || imageUpload.isLoading || !watch("name")}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : imageUpload.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading image...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}