import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useUser } from "@/hooks/repository-hooks/user/use-user";
import { useUserActions } from "@/stores/user-store";
import { useGetOrganizationsByIds } from "@/hooks/repository-hooks/organization/use-organization";
import { useOrganizationActions, useCurrentOrganizationId } from "@/stores/organization-store";

/**
 * UserInitializer component that fetches and initializes user data in the store
 * when the user is authenticated. This component should be placed high in the
 * component tree to ensure user data is available throughout the app.
 */
export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth();
  const { data: userData, isLoading, error } = useUser(userId || "");
  const { setUser, setLoading, setError, setInitialized, clearError } = useUserActions();
  const { setOrganizations, setLoading: setOrgLoading, setError: setOrgError, clearError: clearOrgError, setCurrentOrganizationId } = useOrganizationActions();
  const currentOrganizationId = useCurrentOrganizationId();
  
  // Get organization IDs from user data
  const organizationIds = userData?.organizationIds || [];
  
  // Fetch organizations using useGetOrganizationsByIds
  console.log(organizationIds)
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useGetOrganizationsByIds(organizationIds);
  
  console.log(userData)

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      // User is not authenticated, clear user data
      setUser(null);
      setOrganizations([]);
      setInitialized(true);
      return;
    }

    // Update loading state
    setLoading(isLoading);

    // Handle error state
    if (error) {
      setError(error.message || "Failed to load user data");
      setInitialized(true);
      return;
    }

    // Handle successful data fetch
    if (userData) {
      setUser(userData);
      clearError();
      setInitialized(true);
    }
  }, [userId, isLoaded, userData, isLoading, error, setUser, setLoading, setError, setInitialized, clearError, setOrganizations]);

  // Handle organization fetching
  useEffect(() => {
    if (!userData || organizationIds.length === 0) {
      setOrganizations([]);
      setOrgLoading(false);
      return;
    }

    // Update organization loading state
    setOrgLoading(organizationsLoading);

    if (organizationsError) {
      setOrgError(organizationsError.message || "Failed to load organization data");
      return;
    }

    if (!organizationsLoading && organizations && organizations.length > 0) {
      setOrganizations(organizations);
      clearOrgError();
      
      // Automatically set the first organization as current if none is selected
      if (!currentOrganizationId) {
        setCurrentOrganizationId(organizations[0].id);
      }
    }
  }, [userData, organizations, organizationsLoading, organizationsError, setOrganizations, setOrgLoading, setOrgError, clearOrgError, organizationIds.length, currentOrganizationId, setCurrentOrganizationId]);

  return <>{children}</>;
}

export default UserInitializer;