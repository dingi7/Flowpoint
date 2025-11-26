"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { OWNER_TYPE, Service } from "@/core";
import { formatPrice } from "@/utils/price-format";
import {
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceListProps {
  searchQuery?: string;
  durationFilter?: "all" | "short" | "medium" | "long";
  priceFilter?: "all" | "low" | "mid" | "high";
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onView?: (service: Service) => void;
  servicesData?: { pages: Service[][] };
  isLoading?: boolean;
  error?: Error | null;
}

// Mock data for demonstration

export function ServiceList({
  searchQuery = "",
  durationFilter = "all",
  priceFilter = "all",
  onEdit,
  onDelete,
  onView,
  servicesData,
  isLoading = false,
  error,
}: ServiceListProps) {
  const { t } = useTranslation();
  // Get services from the hook data or fallback to mock data
  const services =
    servicesData?.pages?.flatMap((page: Service[]) => page) || [];

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive">
              {t("services.errorLoading")}: {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter services based on search query and selected filters
  const filteredServices = services
    .filter(
      (service: Service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((service: Service) => {
      const duration = service.duration || 0;
      switch (durationFilter) {
        case "short":
          return duration < 30;
        case "medium":
          return duration >= 30 && duration <= 60;
        case "long":
          return duration > 60;
        default:
          return true;
      }
    })
    .filter((service: Service) => {
      const price = service.price || 0;
      switch (priceFilter) {
        case "low":
          return price < 50;
        case "mid":
          return price >= 50 && price <= 100;
        case "high":
          return price > 100;
        default:
          return true;
      }
    })
    .sort((a: Service, b: Service) => {
      // Sort by order first, then by name as fallback
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getOwnerTypeBadge = (ownerType: string) => {
    return ownerType === OWNER_TYPE.ORGANIZATION ? (
      <Badge variant="secondary">{t("services.organization")}</Badge>
    ) : (
      <Badge variant="outline">{t("services.member")}</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">{t("services.loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredServices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <div className="text-muted-foreground mb-2">
              {searchQuery
                ? t("services.noResultsSearch")
                : t("services.noResults")}
            </div>
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                {t("services.tryAdjusting")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            {t("services.title")} ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("services.tableHeaders.serviceName")}</TableHead>
                  <TableHead>{t("services.tableHeaders.description")}</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {t("services.tableHeaders.price")}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t("services.tableHeaders.duration")}
                    </div>
                  </TableHead>
                  <TableHead>{t("services.tableHeaders.owner")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-muted-foreground">
                      {service.description || t("services.noDescription")}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatPrice(service.price)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatDuration(service.duration)}
                  </TableCell>
                  <TableCell>{getOwnerTypeBadge(service.ownerType)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t("services.actions.openMenu")}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t("services.actions.viewDetails")}
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("services.actions.edit")}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(service)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("services.actions.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
