import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCustomerSchema, type Customer } from "@shared/schema";
import { useLocation } from "wouter";

// Extend the schema for client-side validation
const customerFormSchema = insertCustomerSchema.extend({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Customer;
  isEdit?: boolean;
}

export default function CustomerForm({ initialData, isEdit = false }: CustomerFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Cliente criado",
        description: "O cliente foi criado com sucesso.",
      });
      navigate('/customers');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!initialData?.id) throw new Error('ID do cliente não encontrado');
      
      const res = await apiRequest("PUT", `/api/customers/${initialData.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
      });
      navigate('/customers');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CustomerFormData) => {
    if (isEdit && initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="cliente@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Rua, número, bairro, cidade, estado, CEP" 
                    rows={3} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/customers')}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="btn-primary"
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : isEdit ? 'Atualizar Cliente' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
