import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/layout";
import AppointmentsPage from "./pages/appointments/appointments-page";
import SignInPage from "./pages/auth/sign-in-page";
import SignUpPage from "./pages/auth/sign-up-page";
import CustomersPage from "./pages/customers/customers-page";
import DashboardPage from "./pages/dashboard-page";
import ServicesPage from "./pages/services/services-page";
import { FirebaseTokenProvider } from "./utils/firebase-token-provider";
import UserInitializer from "./components/utils/UserInitializer";
import TeamPage from "./pages/team/team-page";

const queryClient = new QueryClient();

// Get Clerk publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
              path="/dashboard"
              element={
                <SignedIn>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </SignedIn>
              }
            />
            <Route
              path="/customers"
              element={
                <SignedIn>
                  <AppLayout>
                    <CustomersPage />
                  </AppLayout>
                </SignedIn>
              }
            />
            <Route
              path="/team"
              element={
                <SignedIn>
                  <AppLayout>
                    <TeamPage />
                  </AppLayout>
                </SignedIn>
              }
            />
            <Route
              path="/appointments"
              element={
                <SignedIn>
                  <AppLayout>
                    <AppointmentsPage />
                  </AppLayout>
                </SignedIn>
              }
            />
            <Route
              path="/services"
              element={
                <SignedIn>
                  <AppLayout>
                    <ServicesPage />
                  </AppLayout>
                </SignedIn>
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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <FirebaseTokenProvider>
          <UserInitializer>
            <AppContent />
          </UserInitializer>
        </FirebaseTokenProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
