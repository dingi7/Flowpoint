"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Eye, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react"
import { CustomerDetails } from "./CustomerDetails"
import { CustomerForm } from "./CustomerForm"
import { Customer } from "@/core"

// Mock data - in real app this would come from API
const mockCustomers = [
  {
    id: "1",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-15"),
    organizationId: "org_1",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    lastVisit: "2024-01-15",
    totalSpent: 1250,
    address: "123 Main St, New York, NY",
    notes: "Prefers morning appointments",
    customFields: {
      birthday: "1990-05-15",
      referredBy: "Google Search",
      preferences: "Organic products only",
    },
  },
  {
    id: "2",
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2024-01-20"),
    organizationId: "org_1",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 234-5678",
    lastVisit: "2024-01-20",
    totalSpent: 3200,
    address: "456 Oak Ave, Los Angeles, CA",
    notes: "Regular monthly appointments",
    customFields: {
      birthday: "1985-08-22",
      referredBy: "Friend referral",
      preferences: "Premium services",
    },
  },
  {
    id: "3",
    createdAt: new Date("2023-03-05"),
    updatedAt: new Date("2024-01-18"),
    organizationId: "org_1",
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    phone: "+1 (555) 345-6789",
    lastVisit: "2024-01-18",
    totalSpent: 850,
    address: "789 Pine St, Chicago, IL",
    notes: "Sensitive skin, use gentle products",
    customFields: {
      birthday: "1992-12-03",
      referredBy: "Social media",
      preferences: "Hypoallergenic products",
    },
  },
  {
    id: "4",
    createdAt: new Date("2023-04-12"),
    updatedAt: new Date("2023-11-10"),
    organizationId: "org_1",
    name: "David Park",
    email: "david.park@email.com",
    phone: "+1 (555) 456-7890",
    lastVisit: "2023-11-10",
    totalSpent: 420,
    address: "321 Elm St, Seattle, WA",
    notes: "Moved to different city",
    customFields: {
      birthday: "1988-03-17",
      referredBy: "Walk-in",
      preferences: "Budget-friendly options",
    },
  },
  {
    id: "5",
    createdAt: new Date("2023-05-20"),
    updatedAt: new Date("2024-01-22"),
    organizationId: "org_1",
    name: "Lisa Zhang",
    email: "lisa.zhang@email.com",
    phone: "+1 (555) 567-8901",
    lastVisit: "2024-01-22",
    totalSpent: 1680,
    address: "654 Maple Dr, Boston, MA",
    notes: "Books appointments in advance",
    customFields: {
      birthday: "1987-09-28",
      referredBy: "Yelp",
      preferences: "Latest trends and styles",
    },
  },
]

interface CustomerListProps {
  searchQuery: string
}

export function CustomerList({ searchQuery }: CustomerListProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Filter customers based on search
  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)

    return matchesSearch
  })



  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailsOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsEditOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/abstract-geometric-shapes.png?height=40&width=40&query=${customer.name}`} />
                        <AvatarFallback>
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.address.split(",")[1]?.trim() || "N/A"}
                        </p>
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

                  <TableCell>{new Date(customer.lastVisit).toLocaleDateString()}</TableCell>
                  <TableCell>${customer.totalSpent.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Customer
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
              <p className="text-muted-foreground">No customers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="min-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetails
              customer={selectedCustomer}
              onEdit={() => {
                setIsDetailsOpen(false)
                handleEdit(selectedCustomer)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && <CustomerForm customer={editingCustomer} onSuccess={() => setIsEditOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
