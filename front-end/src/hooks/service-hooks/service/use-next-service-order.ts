import { useMemo } from "react";
import { useServices } from "@/hooks/repository-hooks/service/use-service";

export function useNextServiceOrder() {
  
  const { data: servicesData } = useServices({
    pagination: { limit: 1000 }, // Get all services to find max order
  });

  const nextOrder = useMemo(() => {
    if (!servicesData?.pages) return 0;
    
    const allServices = servicesData.pages.flatMap(page => page);
    const maxOrder = Math.max(...allServices.map(service => service.order || 0), -1);
    return maxOrder + 1;
  }, [servicesData]);

  return {
    nextOrder,
    isLoading: !servicesData,
  };
}
