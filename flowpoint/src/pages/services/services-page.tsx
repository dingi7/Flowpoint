"use client";

import { DraggableServiceList } from "@/components/service/DraggableServiceList";
import { ServiceDetails } from "@/components/service/ServiceDetails";
import { ServiceForm } from "@/components/service/ServiceForm";
import { ServiceList } from "@/components/service/ServiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Service } from "@/core";
import {
  useDeleteService,
  useServices,
} from "@/hooks/repository-hooks/service/use-service";
import { useReorderServices } from "@/hooks/service-hooks/service/use-reorder-services";
import { useCurrentOrganizationId } from "@/stores/organization-store";
import { formatPrice } from "@/utils/price-format";
import {
  Clock,
  DollarSign,
  Filter,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { t } = useTranslation();

  // Service hooks
  const currentOrganizationId = useCurrentOrganizationId();
  const deleteServiceMutation = useDeleteService();
  const { reorderServices } = useReorderServices();
  const servicesQuery = useServices({
    pagination: { limit: 50 },
    queryConstraints: searchQuery
      ? [
          { field: "name", operator: ">=", value: searchQuery },
          { field: "name", operator: "<=", value: searchQuery + "\uf8ff" },
        ]
      : [],
  });

  // Get flattened services data for stats
  const allServices = servicesQuery.data?.pages?.flatMap((page) => page) || [];

  // Stats data
  const stats = {
    total: allServices.length,
    active: allServices.length, // All services are considered active since there's no isActive field
    avgPrice: allServices.length
      ? Math.round(
          allServices.reduce(
            (sum: number, service: Service) => sum + (service.price || 0),
            0,
          ) / allServices.length,
        )
      : 0,
    avgDuration: allServices.length
      ? Math.round(
          allServices.reduce(
            (sum: number, service: Service) => sum + (service.duration || 0),
            0,
          ) / allServices.length,
        )
      : 0,
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
      toast.error(t("services.noOrgError"));
      return;
    }

    try {
      await deleteServiceMutation.mutateAsync({
        id: service.id,
        organizationId: currentOrganizationId,
      });
      toast.success(t("services.deletedSuccess"));
    } catch (error) {
      toast.error(t("services.deleteError"));
      console.error("Error deleting service:", error);
    }
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedService(null);
    // Refresh services list
    servicesQuery.refetch();
    toast.success(t("services.savedSuccess"));
  };

  const handleReorderServices = async (services: Service[]) => {
    await reorderServices(services);
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
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground">{t("services.subtitle")}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" variant="default">
                <Plus className="h-4 w-4" />
                {t("services.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("services.addNew")}</DialogTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("services.totalServices")}
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} {t("services.activeServices")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("services.averageDuration")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration}m</div>
            <p className="text-xs text-muted-foreground">
              {t("services.perService")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("services.averagePrice")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.avgPrice)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("services.perService")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("services.activeServices")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {t("services.currentlyAvailable")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("services.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("services.filterByCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("services.allCategories")}</SelectItem>
            <SelectItem value="haircut">{t("services.haircut")}</SelectItem>
            <SelectItem value="styling">{t("services.styling")}</SelectItem>
            <SelectItem value="coloring">{t("services.coloring")}</SelectItem>
            <SelectItem value="treatment">{t("services.treatment")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Settings className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t("services.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("services.allServices")}</SelectItem>
            <SelectItem value="active">{t("services.active")}</SelectItem>
            <SelectItem value="inactive">{t("services.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t("services.allServices")}</TabsTrigger>
          <TabsTrigger value="active">{t("services.active")}</TabsTrigger>
          <TabsTrigger value="popular">{t("services.popular")}</TabsTrigger>
          <TabsTrigger value="recent">
            {t("services.recentlyAdded")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <DraggableServiceList
            searchQuery={searchQuery}
            onEdit={handleEditService}
            onDelete={handleDeleteService}
            onView={handleViewService}
            onReorder={handleReorderServices}
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
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("services.edit")}</DialogTitle>
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
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("services.details")}</DialogTitle>
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
