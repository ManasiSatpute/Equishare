import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { UserProvider } from "./context/UserContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Equipment from "./pages/Equipment";
import NotFound from "./pages/NotFound";
import Tracking from "./pages/Tracking";
import VerifyEmail from "./pages/VerifyEmail";
import DeliveryAgents from "./pages/DeliveryAgents";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/equipment" element={<UserDashboard />} />
              <Route path="/owner-dashboard" element={<OwnerDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/equipment/:id" element={<Equipment />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
              path="/delivery-agents/:rentalId"
              element={<DeliveryAgents />}
            />
            
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UserProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
