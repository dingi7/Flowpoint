import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { useLocation } from "react-router-dom";

export function SiteHeader() {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/customers":
        return "Customers";
      case "/appointments":
        return "Appointments";
      case "/services":
        return "Services";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <span className="bold text-lg">{getPageTitle()}</span>
        <div className="relative max-w-md flex-1 ml-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search customers, appointments..." className="pl-10 bg-background" />
        </div>
        
      </div>
    </header>
  );
}
