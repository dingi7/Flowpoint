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
              Error loading services: {error.message}
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
      <Badge variant="secondary">Organization</Badge>
    ) : (
      <Badge variant="outline">Member</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading services...</div>
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
                ? "No services found matching your search."
                : "No services found."}
            </div>
            {searchQuery && (
              <div className="text-sm text-muted-foreground">
                Try adjusting your search terms.
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
          Services ({filteredServices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Price
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duration
                  </div>
                </TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-muted-foreground">
                      {service.description || "No description"}
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
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(service)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Service
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(service)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Service
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
