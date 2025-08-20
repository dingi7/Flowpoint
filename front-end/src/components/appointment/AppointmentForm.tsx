"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Save, X, Search, Clock, DollarSign, User, Calendar } from "lucide-react"
import { APPOINTMENT_STATUS } from "@/core"

// Mock data for customers and services
const mockCustomers = [
  { id: "1", name: "Sarah Johnson", email: "sarah.johnson@email.com", phone: "+1 (555) 123-4567" },
  { id: "2", name: "Mike Chen", email: "mike.chen@email.com", phone: "+1 (555) 234-5678" },
  { id: "3", name: "Emma Wilson", email: "emma.wilson@email.com", phone: "+1 (555) 345-6789" },
  { id: "4", name: "David Park", email: "david.park@email.com", phone: "+1 (555) 456-7890" },
  { id: "5", name: "Lisa Zhang", email: "lisa.zhang@email.com", phone: "+1 (555) 567-8901" },
]

const mockServices = [
  { id: "1", name: "Hair Cut & Style", duration: 60, price: 85, category: "hair" },
  { id: "2", name: "Color Treatment", duration: 120, price: 150, category: "hair" },
  { id: "3", name: "Facial Treatment", duration: 90, price: 120, category: "beauty" },
  { id: "4", name: "Massage Therapy", duration: 75, price: 100, category: "wellness" },
  { id: "5", name: "Consultation", duration: 30, price: 0, category: "consultation" },
]

interface AppointmentFormProps {
  appointment?: {
    id: string
    customerId: string
    serviceId: string
    startTime: string
    status: string
    description?: string
  }
  onSuccess: () => void
}

export function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    customerId: appointment?.customerId || "",
    serviceId: appointment?.serviceId || "",
    date: appointment?.startTime ? appointment.startTime.split("T")[0] : "",
    time: appointment?.startTime ? appointment.startTime.split("T")[1]?.substring(0, 5) : "",
    status: appointment?.status || APPOINTMENT_STATUS.PENDING,
    notes: appointment?.description || "",
  })

  const [selectedCustomer, setSelectedCustomer] = useState(
    appointment?.customerId ? mockCustomers.find(c => c.id === appointment.customerId) || null : null
  )
  const [selectedService, setSelectedService] = useState(
    appointment?.serviceId ? mockServices.find(s => s.id === appointment.serviceId) || null : null
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In real app, this would make an API call
    console.log("Saving appointment:", {
      ...formData,
      customer: selectedCustomer,
      service: selectedService,
    })
    onSuccess()
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCustomerSelect = (customerId: string) => {
    const customer = mockCustomers.find((c) => c.id === customerId)
    setSelectedCustomer(customer || null)
    handleChange("customerId", customerId)
  }

  const handleServiceSelect = (serviceId: string) => {
    const service = mockServices.find((s) => s.id === serviceId)
    setSelectedService(service || null)
    handleChange("serviceId", serviceId)
  }

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const timeSlots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break // Stop at 6:00 PM
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      timeSlots.push(time)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Select Customer *</Label>
            <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`/abstract-geometric-shapes.png?height=24&width=24&query=${customer.name}`} />
                        <AvatarFallback className="text-xs">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`/abstract-geometric-shapes.png?height=40&width=40&query=${selectedCustomer.name}`}
                  />
                  <AvatarFallback>
                    {selectedCustomer.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <Search className="h-5 w-5" />
            Service Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Select Service *</Label>
            <Select value={formData.serviceId} onValueChange={handleServiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {mockServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration} min • ${service.price === 0 ? "Free" : service.price}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedService && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedService.name}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {selectedService.duration} minutes
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      {selectedService.price === 0 ? "Free" : `$${selectedService.price}`}
                    </div>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground">{selectedService.category}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select value={formData.time} onValueChange={(value) => handleChange("time", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={APPOINTMENT_STATUS.PENDING}>Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value={APPOINTMENT_STATUS.COMPLETED}>Completed</SelectItem>
                <SelectItem value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-sans">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any special requests, preferences, or notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!formData.customerId || !formData.serviceId || !formData.date || !formData.time}
        >
          <Save className="h-4 w-4 mr-2" />
          {appointment ? "Update Appointment" : "Book Appointment"}
        </Button>
      </div>
    </form>
  )
}
