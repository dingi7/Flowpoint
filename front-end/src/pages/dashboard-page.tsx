import { FirstTimeUserWelcome } from "@/components/onboarding/FirstTimeUserWelcome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrganizations } from "@/stores";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const organizations = useOrganizations();

  // If no organizations, show the first-time user welcome experience
  if (organizations.length === 0) {
    return <FirstTimeUserWelcome />;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground font-sans mb-2">
          Welcome back
          {user?.firstName
            ? `, ${user.firstName}`
            : user?.lastName
              ? `, ${user.lastName}`
              : ""}
          !
        </h2>
        <p className="text-muted-foreground">
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appointments Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 completed, 5 upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-accent flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start gap-3" size="lg">
              <Plus className="h-4 w-4" />
              Schedule New Appointment
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
            >
              <Users className="h-4 w-4" />
              Add New Customer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              View Today's Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-sans">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your CRM</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New customer registered</p>
                <p className="text-xs text-muted-foreground">
                  Sarah Johnson - 2 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Appointment completed</p>
                <p className="text-xs text-muted-foreground">
                  Mike Chen - 15 minutes ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-muted-foreground">
                  $150 from Alex Rodriguez - 1 hour ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-sans">Today's Appointments</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View Calendar
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">10:00</span>
                  <span className="text-xs text-muted-foreground">AM</span>
                </div>
                <div>
                  <p className="font-medium">Hair Cut & Style</p>
                  <p className="text-sm text-muted-foreground">
                    with Emma Wilson
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  60 min
                </Badge>
                <Badge className="bg-accent text-accent-foreground">
                  Confirmed
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">2:00</span>
                  <span className="text-xs text-muted-foreground">PM</span>
                </div>
                <div>
                  <p className="font-medium">Consultation</p>
                  <p className="text-sm text-muted-foreground">
                    with David Park
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  30 min
                </Badge>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">4:30</span>
                  <span className="text-xs text-muted-foreground">PM</span>
                </div>
                <div>
                  <p className="font-medium">Color Treatment</p>
                  <p className="text-sm text-muted-foreground">
                    with Lisa Zhang
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  90 min
                </Badge>
                <Badge className="bg-accent text-accent-foreground">
                  Confirmed
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
