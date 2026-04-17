import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireSubscription } from "@/components/RequireSubscription";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Results from "./pages/Results.tsx";
import Auth from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import RouteDetail from "./pages/RouteDetail.tsx";
import Resources from "./pages/Resources.tsx";
import Profile from "./pages/Profile.tsx";
import Pricing from "./pages/Pricing.tsx";
import CheckoutReturn from "./pages/CheckoutReturn.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PaymentTestModeBanner } from "./components/PaymentTestModeBanner";
import { TrialBanner } from "./components/TrialBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// El ErrorBoundary se resetea automáticamente al cambiar de ruta para evitar
// que el usuario quede atrapado en la pantalla de fallback al navegar.
const RoutedShell = () => {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/diagnostico" element={<Onboarding />} />
        <Route path="/resultados" element={<Results />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/precios" element={<Pricing />} />
        <Route path="/checkout/return" element={<CheckoutReturn />} />
        {/* Premium-gated: solo el dashboard requiere trial/suscripción */}
        <Route path="/dashboard" element={<RequireSubscription><Dashboard /></RequireSubscription>} />
        {/* Contenido público — accesible sin pago para marketing y SEO */}
        <Route path="/rutas/:slug" element={<RouteDetail />} />
        <Route path="/recursos" element={<Resources />} />
        {/* Solo requiere login */}
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaymentTestModeBanner />
          <RoutedShell />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
