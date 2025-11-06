"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Service, OWNER_TYPE } from "@/core";
import { Edit, MoreHorizontal, Trash2, Eye, Clock, DollarSign, GripVertical } from "lucide-react";
import { useState } from "react";

interface DraggableServiceListProps {
  searchQuery?: string;
  durationFilter?: "all" | "short" | "medium" | "long";
  priceFilter?: "all" | "low" | "mid" | "high";
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  onView?: (service: Service) => void;
  onReorder?: (services: Service[]) => void;
  servicesData?: { pages: Service[][] };
  isLoading?: boolean;
  error?: Error | null;
}

export function DraggableServiceList({ 
  searchQuery = "", 
  durationFilter = "all",
  priceFilter = "all",
  onEdit, 
  onDelete, 
  onView,
  onReorder,
  servicesData, 
  isLoading = false, 
  error 
}: DraggableServiceListProps) {
  
  const services = servicesData?.pages?.flatMap((page: Service[]) => page) || [];
  const [draggedItem, setDraggedItem] = useState<Service | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<Service | null>(null);
  
  // Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive">Error loading services: {error.message}</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter services based on search query and selected filters
  const filteredServices = services
    .filter((service: Service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

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

  const handleDragStart = (e: React.DragEvent, service: Service) => {
    setDraggedItem(service);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, service: Service) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(service);
  };

  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetService: Service) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetService.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // Create new order for services
    const newServices = [...filteredServices];
    const draggedIndex = newServices.findIndex(s => s.id === draggedItem.id);
    const targetIndex = newServices.findIndex(s => s.id === targetService.id);

    // Remove dragged item and insert at new position
    const [draggedService] = newServices.splice(draggedIndex, 1);
    newServices.splice(targetIndex, 0, draggedService);

    // Update order values
    const updatedServices = newServices.map((service, index) => ({
      ...service,
      order: index
    }));

    onReorder?.(updatedServices);
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  // Handle loading state
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

  // Handle empty state
  if (filteredServices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">
              {searchQuery ? 'No services found matching your search.' : 'No services available.'}
            </div>
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
                <TableHead className="w-[50px]">Drag</TableHead>
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
                <TableRow 
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, service)}
                  onDragOver={(e) => handleDragOver(e, service)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, service)}
                  className={`cursor-move ${
                    draggedItem?.id === service.id ? 'opacity-50' : ''
                  } ${
                    draggedOverItem?.id === service.id ? 'bg-muted/50' : ''
                  }`}
                >
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {service.name}
                  </TableCell>
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
                  <TableCell>
                    {getOwnerTypeBadge(service.ownerType)}
                  </TableCell>
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
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete(service)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
