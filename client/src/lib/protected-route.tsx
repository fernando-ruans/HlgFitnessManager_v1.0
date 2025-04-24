import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  return (
    <Route path={path}>
      {() => {
        // Se estiver carregando, mostrar spinner
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          );
        }
        
        // Se não estiver autenticado, redirecionar para login
        if (!user) {
          window.location.href = "/auth";
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          );
        }
        
        // Se estiver autenticado, renderizar o componente
        return <Component />;
      }}
    </Route>
  );
}
