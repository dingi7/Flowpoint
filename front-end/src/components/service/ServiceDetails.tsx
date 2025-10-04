"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OWNER_TYPE, Service } from "@/core";
import { useUser } from "@/hooks";
import {
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Trash2,
  User,
} from "lucide-react";

interface ServiceDetailsProps {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function ServiceDetails({
  service,
  onEdit,
  onDelete,
  onClose,
}: ServiceDetailsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0
        ? `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${mins > 1 ? "s" : ""}`
        : `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${mins} minute${mins > 1 ? "s" : ""}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getOwnerTypeInfo = (ownerType: string) => {
    return ownerType === OWNER_TYPE.ORGANIZATION
      ? {
          label: "Organization",
          icon: Building,
          variant: "secondary" as const,
        }
      : {
          label: "Member",
          icon: User,
          variant: "outline" as const,
        };
  };

  const serviceOwner = useUser(service.ownerId);
  const ownerInfo = getOwnerTypeInfo(service.ownerType);
  const OwnerIcon = ownerInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-sans">{service.name}</h2>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Service Image Card */}
      {service.image && (
        <Card className="border-none">
          <CardHeader>
            <CardTitle className="text-lg font-sans flex items-center gap-2"></CardTitle>
            <CardContent className="flex justify-center">
              <div className="relative w-128 h-128 rounded-xl overflow-hidden border-2 border-muted">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      {/* Service Information */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Service Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Service Name
                </label>
                <p className="text-base font-medium">{service.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-base">
                  {service.description || "No description provided"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Price
                </label>
                <p className="text-base font-medium">
                  {formatPrice(service.price)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration
                </label>
                <p className="text-base font-medium">
                  {formatDuration(service.duration)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Display Order
                </label>
                <p className="text-base font-medium">{service.order || 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <OwnerIcon className="h-4 w-4" />
              Owner
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={ownerInfo.variant}>{ownerInfo.label}</Badge>
              <span className="text-sm text-muted-foreground">
                {serviceOwner.data?.email}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="border-none">
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created At
              </label>
              <p className="text-base">{formatDate(service.createdAt)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="text-base">{formatDate(service.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
