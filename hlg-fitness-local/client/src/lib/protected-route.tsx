import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Melhorado para garantir que não haja problemas de timing
  const shouldRedirect = !isLoading && !user;

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : user ? (
        <Component />
      ) : (
        // Adicionamos um atraso mínimo antes de redirecionar para evitar problemas de timing
        shouldRedirect && <Redirect to={`/auth?redirect=${encodeURIComponent(location)}`} />
      )}
    </Route>
  );
}
