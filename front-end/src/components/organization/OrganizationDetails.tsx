import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Organization } from "@/core";
import {
    Building,
    Globe,
    Mail,
    MapPin,
    Phone,
    Clock, DollarSign,
    Users
} from "lucide-react";

interface OrganizationDetailsProps {
  organization: Organization;
}

export function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  const workingDays = organization.settings?.workingDays || [];
  const workingDaysLabels = workingDays.map(day => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Mon',
      'TUESDAY': 'Tue', 
      'WEDNESDAY': 'Wed',
      'THURSDAY': 'Thu',
      'FRIDAY': 'Fri',
      'SATURDAY': 'Sat',
      'SUNDAY': 'Sun'
    };
    return dayMap[day] || day;
  });

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {organization.image && (
              <div className="flex-shrink-0">
                <img
                  src={organization.image}
                  alt={organization.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {organization.name}
                </h3>
                {organization.industry && (
                  <Badge variant="secondary" className="mt-1">
                    {organization.industry}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{organization.currency || "EUR"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="font-medium">{organization.settings?.timezone || "UTC"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      {organization.settings?.contactInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organization.settings.contactInfo.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {organization.settings.contactInfo.address}
                    </p>
                  </div>
                </div>
              )}
              {organization.settings.contactInfo.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {organization.settings.contactInfo.phone}
                    </p>
                  </div>
                </div>
              )}
              {organization.settings.contactInfo.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {organization.settings.contactInfo.email}
                    </p>
                  </div>
                </div>
              )}
              {organization.settings.contactInfo.googleMapsUrl && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Google Maps</p>
                    <a
                      href={organization.settings.contactInfo.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Hours & Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Working Hours</p>
              <p className="text-sm text-muted-foreground">
                {organization.settings?.workingHours?.start || "09:00"} - {organization.settings?.workingHours?.end || "17:00"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Working Days</p>
              <div className="flex flex-wrap gap-1">
                {workingDaysLabels.length > 0 ? (
                  workingDaysLabels.map((day, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {day}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Buffer Time</p>
              <p className="text-sm text-muted-foreground">
                {organization.settings?.defaultBufferTime || 0} minutes between appointments
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Cancellation Policy</p>
              <p className="text-sm text-muted-foreground">
                {organization.settings?.appointmentCancellationPolicyHours || 24} hours notice required
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Fields Configuration */}
      {organization.settings?.customerFields && organization.settings.customerFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Custom Customer Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {organization.settings.customerFields.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{field.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.type} {field.isRequired ? "(Required)" : "(Optional)"}
                    </p>
                  </div>
                  <Badge variant={field.isRequired ? "default" : "secondary"}>
                    {field.isRequired ? "Required" : "Optional"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
