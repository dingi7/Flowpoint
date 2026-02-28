import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { BillingGuard } from "./components/billing/BillingGuard";
import { FeatureGuard } from "./components/billing/FeatureGuard";
import { AppLayout } from "./components/layout";
import { LanguageProvider } from "./components/providers/LanguageProvider";
import UserInitializer from "./components/utils/UserInitializer";
import { FEATURES } from "./billing/config";
import AppointmentsPage from "./pages/appointments/appointments-page";
import SignInPage from "./pages/auth/sign-in-page";
import SignUpPage from "./pages/auth/sign-up-page";
import BillingPage from "./pages/billing/billing-page";
import CalendarPage from "./pages/calendar/calendar-page";
import CustomersPage from "./pages/customers/customers-page";
import DashboardPage from "./pages/dashboard-page";
import OrganizationPage from "./pages/organization/organization-page";
import PrivacyPolicyPage from "./pages/privacy-policy-page";
import ReviewPage from "./pages/review/review-page";
import ServicesPage from "./pages/services/services-page";
import TeamPage from "./pages/team/team-page";
import TermsOfServicePage from "./pages/terms-of-service-page";
import { FirebaseTokenProvider } from "./utils/firebase-token-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// Get Clerk publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
// const CLERK_JS_VERSION = "5.56.2";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route
            path="/sign-in"
            element={
              <SignedOut>
                <SignInPage />
              </SignedOut>
            }
          />
          <Route
            path="/sign-up"
            element={
              <SignedOut>
                <SignUpPage />
              </SignedOut>
            }
          />
          <Route
            path="/review"
            element={<ReviewPage />}
          />
          <Route
            path="/privacyPolicy"
            element={<PrivacyPolicyPage />}
          />
          <Route
            path="/termsOfService"
            element={<TermsOfServicePage />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <CalendarPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <CustomersPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <TeamPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <AppointmentsPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <FeatureGuard feature={FEATURES.crm}>
                    <AppLayout>
                      <ServicesPage />
                    </AppLayout>
                  </FeatureGuard>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <AppLayout>
                    <BillingPage />
                  </AppLayout>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <BillingGuard>
                  <AppLayout>
                    <OrganizationPage />
                  </AppLayout>
                </BillingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      // clerkJSVersion={CLERK_JS_VERSION}
    >
      <QueryClientProvider client={queryClient}>
        <FirebaseTokenProvider>
          <LanguageProvider>
            <UserInitializer>
              <AppContent />
            </UserInitializer>
          </LanguageProvider>
        </FirebaseTokenProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
