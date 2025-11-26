"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CustomerForm } from "@/components/customer/CustomerForm";
import { CustomerList } from "@/components/customer/CustomerList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-sans">
            {t("customers.title")}
          </h2>
          <p className="text-muted-foreground">{t("customers.subtitle")}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("customers.add")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:min-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("customers.addNew")}</DialogTitle>
              </DialogHeader>
              <CustomerForm onSuccess={() => setIsAddCustomerOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("customers.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      <CustomerList searchQuery={searchQuery} />
    </main>
  );
}
