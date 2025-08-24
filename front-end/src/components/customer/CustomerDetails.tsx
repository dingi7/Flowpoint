"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Customer } from "@/core";
import {
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Gift,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from "lucide-react";

interface CustomerDetailsProps {
  customer: Customer;
  onEdit: () => void;
}

export function CustomerDetails({ customer, onEdit }: CustomerDetailsProps) {
  // Mock appointment history
  const recentAppointments = [
    {
      date: "2024-01-20",
      service: "Hair Cut & Style",
      amount: 85,
      status: "completed",
    },
    {
      date: "2023-12-15",
      service: "Color Treatment",
      amount: 150,
      status: "completed",
    },
    {
      date: "2023-11-10",
      service: "Consultation",
      amount: 0,
      status: "completed",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={`/abstract-geometric-shapes.png?height=64&width=64&query=${customer.name}`}
            />
            <AvatarFallback className="text-lg">
              {customer.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-2xl font-bold font-sans">{customer.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                Customer since{" "}
                {new Date(
                  customer.lastVisit || customer.createdAt,
                ).getFullYear()}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={onEdit} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {customer.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {customer.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Customer Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Spent</p>
                <p className="text-lg font-bold text-primary">
                  ${customer.totalSpent?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Visit</p>
                <p className="text-sm text-muted-foreground">
                  {customer.lastVisit
                    ? new Date(customer.lastVisit).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Appointments</p>
                <p className="text-sm text-muted-foreground">12 appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Birthday</p>
                <p className="text-sm text-muted-foreground">
                  {customer.customFields.birthday
                    ? new Date(
                        customer.customFields.birthday as string,
                      ).toLocaleDateString()
                    : "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Referred By</p>
                <p className="text-sm text-muted-foreground">
                  {(customer.customFields.referredBy as string) || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Preferences</p>
                <p className="text-sm text-muted-foreground">
                  {(customer.customFields.preferences as string) || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">
            Recent Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAppointments.map((appointment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <div>
                    <p className="font-medium">{appointment.service}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${appointment.amount}</p>
                  <Badge variant="outline" className="text-xs">
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
