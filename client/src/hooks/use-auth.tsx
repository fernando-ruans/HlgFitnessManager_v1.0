import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserWithoutPassword = Omit<SelectUser, "password">;

type AuthContextType = {
  user: UserWithoutPassword | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  updateProfileMutation: ReturnType<typeof useUpdateProfileMutation>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = InsertUser & {
  confirmPassword: string;
};

const userKeys = {
  all: ['/api/user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

const useLoginMutation = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserWithoutPassword) => {
      // Atualiza imediatamente o cache
      queryClient.setQueryData(userKeys.all, user);
      
      // Comunica ao usuário
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${user.name}!`,
      });
      
      // Após notificar o usuário, redirecionar (será feito pela página de autenticação)
    },
    onError: (error: Error) => {
      // Limpa o cache do usuário em caso de erro
      queryClient.setQueryData(userKeys.all, null);
      
      toast({
        title: "Falha no login",
        description: error.message || "Usuário ou senha inválidos",
        variant: "destructive",
      });
    },
  });
};

const useRegisterMutation = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: UserWithoutPassword) => {
      // Atualiza imediatamente o cache
      queryClient.setQueryData(userKeys.all, user);
      
      // Comunica ao usuário
      toast({
        title: "Cadastro realizado com sucesso",
        description: `Bem-vindo à HLG Fitness, ${user.name}!`,
      });
      
      // Após notificar o usuário, redirecionar (será feito pela página de autenticação)
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no cadastro",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    },
  });
};

const useLogoutMutation = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Atualizamos o cache do usuário para null (logout)
      queryClient.setQueryData(userKeys.all, null);
      
      // Invalidamos a query para garantir que os dados são atualizados
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      
      toast({
        title: "Logout realizado com sucesso",
        description: "Você saiu do sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

const useUpdateProfileMutation = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      // Verificar se temos um arquivo ou uma string para avatar
      const hasFileAvatar = userData.avatar && typeof userData.avatar !== 'string';
      
      if (hasFileAvatar) {
        // Criar um FormData para enviar o arquivo
        const formData = new FormData();
        
        // Adicionar o arquivo de avatar
        formData.append('avatar', userData.avatar);
        
        // Adicionar os outros campos
        Object.entries(userData).forEach(([key, value]) => {
          if (key !== 'avatar') {
            formData.append(key, String(value));
          }
        });
        
        // Enviar com FormData
        const response = await fetch('/api/user', {
          method: 'PUT',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar perfil');
        }
        
        return response.json();
      } else {
        // Request normal sem arquivo
        const res = await apiRequest("PUT", "/api/user", userData);
        return await res.json();
      }
    },
    onSuccess: (user: UserWithoutPassword) => {
      queryClient.setQueryData(userKeys.all, user);
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha na atualização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithoutPassword | null>({
    queryKey: userKeys.all,
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: true,  // Refetch quando o foco retorna à janela
    retry: 1,                   // Tenta novamente uma vez em caso de falha
    staleTime: 10 * 1000,        // Considera os dados obsoletos após 10 segundos
  });
  
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  
  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
        updateProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
