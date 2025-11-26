"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomer, useCustomers } from "@/hooks";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Customer } from "@/core";
import {
  Edit,
  Eye,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomerDeleteDialog } from "./CustomerDeleteDialog";
import { CustomerDetails } from "./CustomerDetails";
import { CustomerForm } from "./CustomerForm";

interface CustomerListProps {
  searchQuery: string;
}

export function CustomerList({ searchQuery }: CustomerListProps) {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdFromUrl = searchParams.get("id");

  // Fetch customer if ID is in URL
  const { data: customerFromUrl } = useCustomer(customerIdFromUrl || "");

  // Open dialog when customer ID is in URL
  useEffect(() => {
    if (customerFromUrl && customerIdFromUrl) {
      setSelectedCustomer(customerFromUrl);
      setIsDetailsOpen(true);
      // Remove the ID from URL to clean it up
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("id");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [customerFromUrl, customerIdFromUrl, searchParams, setSearchParams]);

  // Fetch customers using the hook
  const { 
    data, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useCustomers({
    pagination: { limit: 10 },
    queryConstraints: searchQuery
      ? [
          { field: "name", operator: ">=", value: searchQuery },
          { field: "name", operator: "<=", value: searchQuery + "\uf8ff" },
        ]
      : [],
    orderBy: {
      field: searchQuery.trim() ? "name" : "updatedAt",
      direction: "desc",
    },
  });

  console.log(error);

  // Flatten the infinite query data
  const customers = data?.pages.flatMap((page) => page) || [];
  
  // Total count from all pages (for display)
  const totalCount = customers.length;

  // Filter customers based on search (client-side filtering as fallback)
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone?.includes(searchQuery));

    return matchesSearch;
  });

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">{t("customers.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">
            {t("customers.title")} ({totalCount}{hasNextPage ? "+" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("customers.tableHeaders.customer")}</TableHead>
                <TableHead>{t("customers.tableHeaders.contact")}</TableHead>
                <TableHead>{t("customers.tableHeaders.created")}</TableHead>
                <TableHead>{t("customers.tableHeaders.updated")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`/abstract-geometric-shapes.png?height=40&width=40&query=${customer.name}`}
                        />
                        <AvatarFallback>
                          {customer.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {customer.address.split(",")[1]?.trim() || t("customers.notAvailable")}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : t("customers.notAvailable")}
                  </TableCell>
                  <TableCell>
                    {customer.updatedAt
                      ? new Date(customer.updatedAt).toLocaleDateString()
                      : t("customers.notAvailable")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t("customers.actions.label")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(customer)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("customers.actions.viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t("customers.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("customers.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t("customers.noResults")}
              </p>
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loadingMore")}
                  </>
                ) : (
                  t("common.loadMore")
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="min-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("customers.details")}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetails
              customer={selectedCustomer}
              onEdit={() => {
                setIsDetailsOpen(false);
                handleEdit(selectedCustomer);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("customers.edit")}</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <CustomerDeleteDialog
        customer={customerToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      />
    </>
  );
}
