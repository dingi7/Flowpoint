"use client";

import { useAuth, UserButton } from "@clerk/clerk-react";
import { ChartCandlestick, Coins, LayoutDashboard } from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "react-router-dom";

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
import { User } from "@/core";
import { useUser } from "@/hooks";
import { ModeToggle } from "../ui/mode-toggle";
import { useTheme } from "../ui/theme-provider";

const data = {
  user: {
    name: "Trading User",
    email: "user@starting-point.app",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Contests",
      url: "/contests",
      icon: ChartCandlestick,
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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
  const { theme } = useTheme();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 h-full w-fit"
            >
              <Link to="/dashboard">
                {theme == "light" ? (
                  <Coins color={"black"} />
                ) : (
                  <Coins color={"white"} />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between flex-row">
        {user.data && <NavUser user={user.data} />}
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
