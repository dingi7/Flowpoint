"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceForm } from "@/components/service/ServiceForm";
import { ServiceList } from "@/components/service/ServiceList";
import { ServiceDetails } from "@/components/service/ServiceDetails";
import { Service } from "@/core";
import { Plus, Search, Filter, Settings, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import { useServices, useDeleteService } from "@/hooks/repository-hooks/service/use-service";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { toast } from "sonner";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // Get flattened services data for stats
  const allServices = servicesQuery.data?.pages?.flatMap(page => page) || [];

  // Stats data
  const stats = {
    total: allServices.length,
    active: allServices.filter((service: Service) => service.isActive !== false).length,
    categories: new Set(allServices.map((service: Service) => service.category).filter(Boolean)).size,
    avgPrice: allServices.length ?
      Math.round((allServices.reduce((sum: number, service: Service) => sum + (service.price || 0), 0) / allServices.length)) : 0,
  };

  // const handleAddService = () => {
  //   setIsAddDialogOpen(true);
  // };

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
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex sm:items-center justify-between mb-6 sm:flex-row flex-col">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            Service Management
          </h2>
          <p className="text-muted-foreground">
            Manage your organization's services and offerings
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:min-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <ServiceForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">Service categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Price
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPrice}</div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="haircut">Haircut</SelectItem>
            <SelectItem value="styling">Styling</SelectItem>
            <SelectItem value="coloring">Coloring</SelectItem>
            <SelectItem value="treatment">Treatment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Settings className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Services</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ServiceList
            searchQuery={searchQuery}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            onView={handleViewService}
            servicesData={servicesQuery.data}
            isLoading={servicesQuery.isLoading}
            error={servicesQuery.error}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          <ServiceList
            searchQuery={searchQuery}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            onView={handleViewService}
            servicesData={servicesQuery.data}
            isLoading={servicesQuery.isLoading}
            error={servicesQuery.error}
          />
        </TabsContent>
        <TabsContent value="popular" className="mt-6">
          <ServiceList
            searchQuery={searchQuery}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            onView={handleViewService}
            servicesData={servicesQuery.data}
            isLoading={servicesQuery.isLoading}
            error={servicesQuery.error}
          />
        </TabsContent>
        <TabsContent value="recent" className="mt-6">
          <ServiceList
            searchQuery={searchQuery}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            onView={handleViewService}
            servicesData={servicesQuery.data}
            isLoading={servicesQuery.isLoading}
            error={servicesQuery.error}
          />
        </TabsContent>
      </Tabs>



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
    </main>
  );
}
