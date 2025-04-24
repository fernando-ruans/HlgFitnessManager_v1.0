import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShoppingBag, Users, Package, AlertTriangle, Phone, HelpCircle } from "lucide-react";
import { Product, Customer, Sale } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Import our new components
import StatCard from "@/components/dashboard/stat-card";
import RecentSales from "@/components/dashboard/recent-sales";
import LowStockProducts from "@/components/dashboard/low-stock-products";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  
  // Detectar se estamos em um dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      const mobileDetected = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobileDetected);
      // Mostrar alerta apenas na primeira visita para dispositivos móveis
      if (mobileDetected && !localStorage.getItem('mobile-alert-shown')) {
        setShowMobileWarning(true);
        localStorage.setItem('mobile-alert-shown', 'true');
      }
    };
    
    checkIfMobile();
    
    // Também verificar quando redimensionar a janela
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });
  
  // Low stock products
  const { data: lowStockProducts, isLoading: isLoadingLowStock } = useQuery<Product[]>({
    queryKey: ['/api/dashboard/low-stock'],
    enabled: !!user,
  });
  
  // Recent sales
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ['/api/sales'],
    enabled: !!user,
  });
  
  // Get recent sales
  const recentSales = sales?.slice(0, 4) || [];
  
  // Get customers for sales display
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    enabled: !!user && recentSales.length > 0,
  });
  
  const isLoading = isLoadingStats || isLoadingLowStock || isLoadingSales;
  
  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Carregando dados...">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout 
      title={`Bem-vindo, ${user?.name?.split(' ')[0] || 'Usuário'}!`} 
      subtitle="Resumo de atividades da sua loja"
    >
      {/* Alerta para dispositivos móveis sobre APK */}
      {showMobileWarning && isMobile && (
        <Alert className="mb-6 bg-primary/10 border-primary text-white">
          <Phone className="h-4 w-4 mr-2" />
          <AlertTitle className="text-white">Disponível para Android</AlertTitle>
          <AlertDescription className="text-gray-100">
            <p className="mb-2">Esta aplicação pode ser instalada como um aplicativo nativo no seu dispositivo Android para uma experiência melhor.</p>
            <div className="flex items-center gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                className="border-white text-white hover:bg-primary"
                onClick={() => {
                  toast({
                    title: "Instalar como APK",
                    description: "Siga as instruções no README para converter esta aplicação em um APK e instalar no seu dispositivo Android.",
                  });
                  setShowMobileWarning(false);
                }}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Saiba mais
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowMobileWarning(false)}
              >
                Fechar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Vendas Hoje"
          value={formatCurrency(stats?.totalSalesToday || 0)}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconClass="stat-icon-secondary"
          trend={{
            value: '12%',
            isUp: true,
            label: 'vs. ontem'
          }}
        />
        
        <StatCard 
          title="Novos Clientes"
          value={stats?.newCustomersToday || 0}
          icon={<Users className="w-5 h-5" />}
          iconClass="stat-icon-primary"
          trend={{
            value: '3',
            isUp: true,
            label: 'vs. ontem'
          }}
        />
        
        <StatCard 
          title="Produtos Vendidos"
          value={stats?.productsSoldToday || 0}
          icon={<Package className="w-5 h-5" />}
          iconClass="stat-icon-warning"
          trend={{
            value: '7',
            isUp: true,
            label: 'vs. ontem'
          }}
        />
        
        <StatCard 
          title="Estoque Crítico"
          value={lowStockProducts?.length || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconClass="stat-icon-danger"
          trend={{
            value: '2',
            isUp: false,
            label: 'vs. semana passada'
          }}
        />
      </div>
      
      {/* Recent sales and low stock products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentSales 
          sales={recentSales} 
          customers={customers} 
          loading={isLoadingSales} 
        />
        
        <LowStockProducts 
          products={lowStockProducts} 
          loading={isLoadingLowStock} 
        />
      </div>
    </DashboardLayout>
  );
}
