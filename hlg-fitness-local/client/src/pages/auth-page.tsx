import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import hlgLogo from "@/assets/hlg-fitness-logo.png";

const loginSchema = z.object({
  username: z.string().min(1, "O nome de usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

const registerSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [error, setError] = useState<string | null>(null);
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const redirectTo = searchParams.get("redirect") || "/";

  // Efeito para verificar o estado do usuário e redirecionar se necessário
  useEffect(() => {
    // Se o usuário está logado e não está em uma operação de login/registro
    if (user && !loginMutation.isPending && !registerMutation.isPending) {
      navigate(redirectTo);
    }
  }, [user, loginMutation.isPending, registerMutation.isPending, navigate, redirectTo]);

  // Efeito para redirecionar após login/registro bem-sucedido
  useEffect(() => {
    const isLoginSuccess = loginMutation.isSuccess;
    const isRegisterSuccess = registerMutation.isSuccess;
    
    if ((isLoginSuccess || isRegisterSuccess) && user) {
      // Redirecionar imediatamente
      navigate(redirectTo);
      
      // Forçar um refresh da página para garantir que todos os componentes são atualizados
      window.location.href = redirectTo;
    }
  }, [loginMutation.isSuccess, registerMutation.isSuccess, user, navigate, redirectTo]);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onLoginSubmit(data: LoginValues) {
    setError(null);
    try {
      await loginMutation.mutateAsync(data);
      // Não precisamos navegar aqui, o useEffect cuidará disso quando o usuário for carregado
    } catch (err: any) {
      setError(err.message || "Falha ao fazer login. Verifique suas credenciais.");
    }
  }

  async function onRegisterSubmit(data: RegisterValues) {
    setError(null);
    try {
      await registerMutation.mutateAsync(data);
      // Não precisamos navegar aqui, o useEffect cuidará disso quando o usuário for carregado
    } catch (err: any) {
      // Se ocorrer um erro, mostrar mensagem e trocar para a guia de login
      setError(err.message || "Falha ao registrar. Tente um nome de usuário diferente.");
      // Se for um erro como "Nome de usuário já existe", mudar para a guia de login
      if (err.message?.includes("already exists")) {
        setActiveTab("login");
      }
    }
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={hlgLogo} alt="HLG Fitness Logo" className="h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">HLG Fitness</h1>
          <p className="text-muted-foreground mt-2">Gerenciamento de loja fitness</p>
        </div>
        
        <Card className="bg-card border-muted">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full rounded-none bg-muted">
                <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-card data-[state=active]:text-foreground">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-none data-[state=active]:bg-card data-[state=active]:text-foreground">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="p-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email ou Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-secondary text-white hover:bg-secondary-light" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <Button variant="link" className="text-secondary p-0 h-auto" disabled={isLoading}>
                        Esqueceu sua senha?
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register" className="p-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome Completo" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="usuário" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-secondary text-white hover:bg-secondary-light" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Registrando..." : "Cadastrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>© {new Date().getFullYear()} HLG Fitness. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
