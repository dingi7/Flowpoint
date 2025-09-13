"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ServiceForm } from "@/components/service/ServiceForm";
import { ServiceList } from "@/components/service/ServiceList";
import { ServiceDetails } from "@/components/service/ServiceDetails";
import { Service } from "@/core";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useServices, useDeleteService } from "@/hooks/repository-hooks/service/use-service";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { toast } from "sonner";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Service hooks
  const currentOrganizationId = useCurrentOrganizationId();
  const deleteServiceMutation = useDeleteService();
  const servicesQuery = useServices({
    pagination: { limit: 50 },
    queryConstraints: searchQuery ? [
      { field: "name", operator: ">=", value: searchQuery },
      { field: "name", operator: "<=", value: searchQuery + '\uf8ff' }
    ] : [],
    orderBy: {
      field: searchQuery.trim() ? "name" : "updatedAt",
      direction: "desc",
    },
  });

  const handleAddService = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setIsDetailsDialogOpen(true);
  };

  const handleDeleteService = async (service: Service) => {
    if (!currentOrganizationId) {
      toast.error("No organization selected");
      return;
    }
    
    try {
      await deleteServiceMutation.mutateAsync({ 
        id: service.id, 
        organizationId: currentOrganizationId 
      });
      toast.success("Service deleted successfully");
    } catch (error) {
      toast.error("Failed to delete service");
      console.error("Error deleting service:", error);
    }
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedService(null);
    // Refresh services list
    servicesQuery.refetch();
    toast.success("Service saved successfully");
  };

  const handleFormCancel = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedService(null);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold font-sans">Services</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage your organization's services and offerings
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddService}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Services List */}
      <ServiceList
        searchQuery={searchQuery}
        onEdit={handleEditService}
        onDelete={handleDeleteService}
        onView={handleViewService}
        servicesData={servicesQuery.data}
        isLoading={servicesQuery.isLoading}
        error={servicesQuery.error}
      />

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <ServiceForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <ServiceForm
              service={selectedService}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Service Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <ServiceDetails
              service={selectedService}
              onEdit={() => {
                setIsDetailsDialogOpen(false);
                handleEditService(selectedService);
              }}
              onDelete={() => {
                setIsDetailsDialogOpen(false);
                handleDeleteService(selectedService);
              }}
              onClose={() => setIsDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
