import { Calendar } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-sans">Appointments</h1>
        </div>
        <p className="text-muted-foreground">Schedule and manage your appointments and bookings.</p>
      </div>
      
      <div className="space-y-6">
        {/* Appointments content will go here */}
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Appointment Scheduling</h3>
          <p className="text-muted-foreground">Your appointment management features will be implemented here.</p>
        </div>
      </div>
    </main>
  );
}