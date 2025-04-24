import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileInput } from "@/components/ui/file-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { User, Mail, Lock, UserPlus, Loader2 } from "lucide-react";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  avatar: z.any().optional(),
});

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, updateProfileMutation } = useAuth();
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      avatar: user?.avatar || "",
    },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const handleProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };
  
  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    try {
      await updateProfileMutation.mutateAsync({
        password: data.newPassword,
        currentPassword: data.currentPassword,
      });
      
      // Reset form on success
      passwordForm.reset();
    } catch (error) {
      console.error("Failed to update password:", error);
    }
  };
  
  const isProfileSubmitting = updateProfileMutation.isPending;
  
  return (
    <DashboardLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" /> Informações Pessoais
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center">
                <Lock className="mr-2 h-4 w-4" /> Segurança
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full max-w-md">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isProfileSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={isProfileSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isProfileSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="avatar"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foto de Perfil</FormLabel>
                            <FormControl>
                              <FileInput
                                id="avatar-upload"
                                onChange={field.onChange}
                                value={field.value}
                                accept="image/*"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="bg-secondary text-white hover:bg-secondary-light"
                        disabled={isProfileSubmitting}
                      >
                        {isProfileSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar Alterações"
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
                
                <div className="text-center md:w-1/3">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={user?.avatar ? `/${user.avatar}` : ""} />
                      <AvatarFallback className="bg-secondary text-slate-200 text-3xl">
                        {getInitials(user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-medium">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Mail className="mr-1 h-3 w-3" />
                      {user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <UserPlus className="mr-1 h-3 w-3" />
                      @{user?.username}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="w-full max-w-md">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isProfileSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isProfileSubmitting} />
                          </FormControl>
                          <FormDescription>
                            A senha deve ter pelo menos 6 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isProfileSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="bg-secondary text-white hover:bg-secondary-light"
                      disabled={isProfileSubmitting}
                    >
                      {isProfileSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        "Alterar Senha"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
