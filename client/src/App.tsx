import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProductsPage from "@/pages/products-page";
import ProductDetailPage from "@/pages/product-detail-page";
import CustomersPage from "@/pages/customers-page";
import CustomerDetailPage from "@/pages/customer-detail-page";
import SalesPage from "@/pages/sales-page";
import SaleDetailPage from "@/pages/sale-detail-page";
import ReportsPage from "@/pages/reports-page";
import ProfilePage from "@/pages/profile-page";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/new" component={ProductDetailPage} />
      <ProtectedRoute path="/products/:id" component={ProductDetailPage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/customers/new" component={CustomerDetailPage} />
      <ProtectedRoute path="/customers/:id" component={CustomerDetailPage} />
      <ProtectedRoute path="/sales" component={SalesPage} />
      <ProtectedRoute path="/sales/new" component={SaleDetailPage} />
      <ProtectedRoute path="/sales/:id" component={SaleDetailPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
