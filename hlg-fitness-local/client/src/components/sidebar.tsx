import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  ShoppingCart, 
  FileText, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import hlgLogo from '@/assets/hlg-fitness-logo.png';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, icon, children }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href} className={cn(
      "nav-link",
      isActive ? "nav-link-active" : "nav-link-inactive"
    )}>
      {icon}
      <span className="ml-3">{children}</span>
    </Link>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const { data: lowStockData } = useQuery({
    queryKey: ['/api/dashboard/low-stock'],
    enabled: !!user,
  });
  
  const lowStockCount = lowStockData?.length || 0;
  
  const sidebarContent = (
    <>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavLink href="/" icon={<BarChart3 className="w-5 h-5" />}>
          Dashboard
        </NavLink>
        <NavLink href="/products" icon={<ShoppingBag className="w-5 h-5" />}>
          Produtos
        </NavLink>
        <NavLink href="/customers" icon={<Users className="w-5 h-5" />}>
          Clientes
        </NavLink>
        <NavLink href="/sales" icon={<ShoppingCart className="w-5 h-5" />}>
          Vendas
        </NavLink>
        <NavLink href="/reports" icon={<FileText className="w-5 h-5" />}>
          Relatórios
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-muted">
        <div className="bg-muted rounded-md p-3">
          <p className="text-sm text-foreground font-medium">Estoque crítico</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lowStockCount} {lowStockCount === 1 ? 'produto' : 'produtos'} abaixo do mínimo
          </p>
          
          <Link href="/products" className="mt-2 text-xs text-secondary flex items-center hover:underline">
            Verificar produtos
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
  
  // Mobile sidebar
  if (isMobile) {
    return (
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-card shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <div className="flex items-center">
            <img src={hlgLogo} alt="HLG Fitness Logo" className="h-8" />
            <span className="ml-2 font-semibold text-foreground">HLG Fitness</span>
          </div>
          <button 
            className="text-foreground p-1" 
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {sidebarContent}
      </aside>
    );
  }
  
  // Desktop sidebar
  return (
    <aside className="hidden md:flex flex-col w-64 bg-card shadow-md z-10">
      {sidebarContent}
    </aside>
  );
}
