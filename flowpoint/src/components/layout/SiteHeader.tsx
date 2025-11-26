import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Appointment, Customer } from "@/core";
import { useSearchAppointments, useSearchCustomers } from "@/hooks";
import { cn } from "@/lib/utils";
import { Calendar, Globe, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Logo } from "../ui/logo";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

export function SiteHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search hooks
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useSearchCustomers(debouncedQuery, 10);
  const { data: appointments = [], isLoading: isLoadingAppointments } =
    useSearchAppointments(debouncedQuery, 10);

  const hasResults = customers.length > 0 || appointments.length > 0;
  const isLoading = isLoadingCustomers || isLoadingAppointments;
  const showResults = isOpen && debouncedQuery.length >= 2;

  const handleCustomerClick = (customer: Customer) => {
    setIsOpen(false);
    setSearchQuery("");
    navigate(`/customers?id=${customer.id}`);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setIsOpen(false);
    setSearchQuery("");
    navigate(`/appointments?id=${appointment.id}`);
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-8">
        <div className="flex items-center gap-1 lg:gap-2 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <Popover open={showResults} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <div className="relative max-w-md flex-1 ml-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none z-10" />
                <Input
                  ref={inputRef}
                  placeholder={t("search.placeholder")}
                  className="pl-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => {
                    if (debouncedQuery.length >= 2) {
                      setIsOpen(true);
                    }
                  }}
                />
              </div>
            </PopoverTrigger>
            {showResults && (
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t("search.searching")}
                  </div>
                ) : !hasResults ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t("search.noResults", { query: debouncedQuery })}
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {customers.length > 0 && (
                      <div className="p-2">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {t("search.customers")}
                        </div>
                        {customers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleCustomerClick(customer)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                            )}
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {customer.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {customer.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {appointments.length > 0 && (
                      <div className="p-2">
                        {customers.length > 0 && (
                          <div className="h-px bg-border mx-2 my-2" />
                        )}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {t("search.appointments")}
                        </div>
                        {appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                            )}
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {appointment.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {appointment.description ||
                                  t("search.noDescription")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </PopoverContent>
            )}
          </Popover>
        </div>
        <div className="flex items-center h-full pb-2 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("common.language")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage("en")}>
                {t("common.english")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage("bg")}>
                {t("common.bulgarian")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Logo className="object-contain" width={140} height={45} />
        </div>
      </div>
    </header>
  );
}
