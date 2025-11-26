"use client";

import { useAuth, UserButton } from "@clerk/clerk-react";
import {
  Bell,
  Building,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  NotebookTabs,
  Plus,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { InvitationNotifications } from "@/components/invitation/InvitationNotifications";
import { CreateOrganizationModal } from "@/components/organization/CreateOrganizationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { InviteStatus, User } from "@/core";
import { useInvitesByEmail, useUser } from "@/hooks";
import {
  useCurrentOrganizationId,
  useOrganizationActions,
  useOrganizations,
  useSelectedOrganization,
} from "@/stores";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { ModeToggle } from "../ui/mode-toggle";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Team",
      url: "/team",
      icon: Users,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: UserRound,
    },
    {
      title: "Appointments",
      url: "/appointments",
      icon: Calendar,
    },
    {
      title: "Services",
      url: "/services",
      icon: NotebookTabs,
    },
    {
      title: "Organization",
      url: "/organization",
      icon: Settings,
    },
  ],
  notifications: [
    {
      id: 1,
      title: "New Contest Available",
      message: "A new trading contest has started. Join now to compete!",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Portfolio Update",
      message: "Your portfolio performance has been updated.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "System Maintenance",
      message: "Scheduled maintenance will occur tonight at 2 AM.",
      time: "3 hours ago",
      read: true,
    },
  ],
};

function NavMain({ items }: { items: typeof data.navMain }) {
  const location = useLocation();

  const isActivePage = (href: string) => {
    return (
      location.pathname === href ||
      (href === "/dashboard" && location.pathname === "/")
    );
  };

  const { t } = useTranslation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("navigation.label")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActivePage(item.url)}>
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NotificationsDropdown() {
  const { user } = useClerkUser();
  const { data: invitations = [] } = useInvitesByEmail(
    user?.primaryEmailAddress?.emailAddress || "",
  );

  const pendingInvitationsCount = invitations.filter(
    (inv) => inv.status === InviteStatus.PENDING,
  ).length;

  const { t } = useTranslation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("notifications.label")}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton>
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    {pendingInvitationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                    )}
                  </div>
                  <span>{t("notifications.invitations")}</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent className="w-100 p-0" side="right" align="start">
                <div className="p-4 border-b">
                  <h4 className="font-semibold">
                    {t("notifications.orgInvitations")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("notifications.manageInvitations")}
                  </p>
                </div>
                <InvitationNotifications />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser({ user }: { user: User }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                    userButtonPopoverCard: "bg-card border-border",
                    userButtonPopoverActionButton:
                      "text-foreground hover:bg-accent",
                  },
                }}
              />
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground text-sm">
                  {user.email.length > 18
                    ? `${user.email.slice(0, 18)}...`
                    : user.email}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userId } = useAuth();
  const user = useUser(userId as string);
  const organizations = useOrganizations();
  const selectedOrganization = useSelectedOrganization();
  const currentOrganizationId = useCurrentOrganizationId();
  const { setSelectedOrganization, setCurrentOrganizationId } =
    useOrganizationActions();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const { t } = useTranslation();

  const navMain = [
    {
      title: t("navigation.dashboard"),
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("navigation.calendar"),
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: t("navigation.team"),
      url: "/team",
      icon: Users,
    },
    {
      title: t("navigation.customers"),
      url: "/customers",
      icon: UserRound,
    },
    {
      title: t("navigation.appointments"),
      url: "/appointments",
      icon: Calendar,
    },
    {
      title: t("navigation.services"),
      url: "/services",
      icon: NotebookTabs,
    },
    {
      title: t("navigation.organization"),
      url: "/organization",
      icon: Settings,
    },
  ];

  // Sync selectedOrganization with currentOrganizationId when organizations are updated
  useEffect(() => {
    if (currentOrganizationId && organizations.length > 0) {
      const org = organizations.find((o) => o.id === currentOrganizationId);
      if (org && org.id !== selectedOrganization?.id) {
        setSelectedOrganization(org);
      }
    } else if (!selectedOrganization && organizations.length > 0) {
      // Set default selected organization if none is selected and organizations are available
      setSelectedOrganization(organizations[0]);
    }
  }, [
    currentOrganizationId,
    selectedOrganization,
    organizations,
    setSelectedOrganization,
  ]);
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 h-full w-fit"
            >
              {organizations.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-3 transition-all duration-200 group">
                      <div className="relative">
                        <img
                          src={
                            selectedOrganization?.image ||
                            "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=32&h=32&fit=crop&crop=center"
                          }
                          alt={selectedOrganization?.name || "Organization"}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-base text-foreground block truncate">
                          {selectedOrganization?.name || "No Organization"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("organization.label")}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-72 p-2 shadow-lg border-0 bg-background/95 backdrop-blur-sm"
                  >
                    <div className="space-y-1">
                      {organizations.map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={() => {
                            setSelectedOrganization(org);
                            setCurrentOrganizationId(org.id);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-0 ${
                            selectedOrganization?.id === org.id
                              ? "bg-primary/10 shadow-sm"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <div className="relative">
                            <img
                              src={
                                org.image ||
                                "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=32&h=32&fit=crop&crop=center"
                              }
                              alt={org.name}
                              className="w-10 h-10 rounded-xl object-cover shadow-sm"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-foreground block truncate">
                              {org.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t("organization.switch")}
                            </span>
                          </div>
                          {selectedOrganization?.id === org.id && (
                            <div className="w-2 h-2 bg-primary rounded-full shadow-sm" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-0 hover:bg-accent/50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-foreground block truncate">
                            {t("organization.create")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("organization.add")}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-3 transition-all duration-200 group">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-base text-foreground block truncate">
                          {t("organization.noOrganization")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("organization.createStart")}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-72 p-2 shadow-lg border-0 bg-background/95 backdrop-blur-sm"
                  >
                    <div className="space-y-1">
                      <DropdownMenuItem
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border-0 hover:bg-accent/50"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Plus className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-foreground block truncate">
                            {t("organization.create")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("organization.add")}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={organizations.length > 0 ? navMain : [navMain[0]]} />
        {organizations.length > 0 && <NotificationsDropdown />}
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between flex-row">
        {user.data && <NavUser user={user.data} />}
        <ModeToggle />
      </SidebarFooter>
      <CreateOrganizationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </Sidebar>
  );
}
