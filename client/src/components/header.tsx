import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { cn, getInitials } from '@/lib/utils';
import { 
  Menu, 
  Bell, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  ChevronDown,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import hlgLogo from '@/assets/hlg-fitness-logo.png';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };
  
  return (
    <header className="bg-card shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2 text-foreground" 
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/">
              <div className="flex items-center">
                <img src={hlgLogo} alt="HLG Fitness Logo" className="h-12" />
                <span className="ml-2 font-semibold text-foreground hidden sm:block">HLG Fitness</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center">
            <NotificationsDropdown />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center ml-4 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar ? `/${user.avatar}` : ''} />
                    <AvatarFallback className="bg-secondary text-white">
                      {user ? getInitials(user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 text-sm font-medium text-foreground hidden sm:block">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card text-foreground">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4 text-white" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-white" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Mock notifications data (in a real app, this would come from an API)
  const notifications = [
    {
      id: 1,
      title: 'Estoque baixo',
      message: 'Legging Preta - Apenas 2 unidades',
      time: '30 minutos',
      type: 'stock'
    },
    {
      id: 2,
      title: 'Nova venda',
      message: 'Venda #123 finalizada com sucesso',
      time: '1 hora',
      type: 'sale'
    },
    {
      id: 3,
      title: 'Novo cliente',
      message: 'Fernanda Silva acabou de se cadastrar',
      time: '3 horas',
      type: 'customer'
    }
  ];
  
  return (
    <div className="relative" ref={ref}>
      <button 
        className="p-1 text-foreground mr-3 relative"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg py-1 z-20">
          <div className="px-4 py-2 border-b border-muted">
            <h3 className="font-medium text-foreground">Notificações</h3>
          </div>
          
          {notifications.map(notification => (
            <a key={notification.id} href="#" className="block px-4 py-3 hover:bg-muted transition duration-150 border-b border-muted">
              <div className="flex items-start">
                <div className={cn(
                  "flex-shrink-0 rounded-full p-2 text-white",
                  notification.type === 'stock' ? "bg-warning" :
                  notification.type === 'sale' ? "bg-success" : "bg-secondary"
                )}>
                  {notification.type === 'stock' && <AlertTriangle className="h-4 w-4" />}
                  {notification.type === 'sale' && <ShoppingCart className="h-4 w-4" />}
                  {notification.type === 'customer' && <UserIcon className="h-4 w-4" />}
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm font-medium text-white">{notification.title}</p>
                  <p className="text-xs text-white opacity-80">{notification.message}</p>
                  <p className="text-xs text-white opacity-70 mt-1">há {notification.time}</p>
                </div>
              </div>
            </a>
          ))}
          
          <a href="#" className="block text-center text-sm text-secondary py-2 hover:underline">
            Ver todas
          </a>
        </div>
      )}
    </div>
  );
}
