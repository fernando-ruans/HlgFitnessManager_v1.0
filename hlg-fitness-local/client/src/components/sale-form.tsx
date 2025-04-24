import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema, insertSaleItemSchema, type Sale, type Product, type Customer, type SaleWithItems } from "@shared/schema";
import { useLocation } from "wouter";
import { calculateTotal, formatCurrency, statusOptions } from "@/lib/utils";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

// Combine sale and items schemas
const saleFormSchema = z.object({
  sale: insertSaleSchema,
  items: z.array(
    insertSaleItemSchema.omit({ saleId: true }).extend({
      productId: z.coerce.number().min(1, "Selecione um produto"),
      quantity: z.coerce.number().int().min(1, "Quantidade deve ser pelo menos 1"),
      price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
    })
  ).min(1, "Adicione pelo menos um item"),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SaleFormProps {
  initialData?: SaleWithItems;
  isEdit?: boolean;
}

export default function SaleForm({ initialData, isEdit = false }: SaleFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [total, setTotal] = useState(0);
  
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: initialData ? {
      sale: {
        customerId: initialData.customerId,
        date: initialData.date,
        total: initialData.total,
        status: initialData.status,
      },
      items: initialData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    } : {
      sale: {
        customerId: 0,
        date: new Date().toISOString(),
        total: 0,
        status: 'completed',
      },
      items: [
        {
          productId: 0,
          quantity: 1,
          price: 0,
        },
      ],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Recalculate total when items change
  useEffect(() => {
    const values = form.getValues();
    if (values.items) {
      const calculatedTotal = values.items.reduce((acc, item) => {
        return acc + calculateTotal(item.price, item.quantity);
      }, 0);
      
      setTotal(calculatedTotal);
      form.setValue('sale.total', calculatedTotal);
    }
  }, [form.watch('items')]);
  
  // Update price when selecting a product
  const handleProductChange = (index: number, productId: number) => {
    if (productId && products) {
      const product = products.find(p => p.id === productId);
      if (product) {
        form.setValue(`items.${index}.price`, product.price);
      }
    }
  };
  
  const createMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const res = await apiRequest("POST", "/api/sales", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Venda registrada",
        description: "A venda foi registrada com sucesso.",
      });
      navigate('/sales');
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
    mutationFn: async (data: SaleFormData) => {
      if (!initialData?.id) throw new Error('ID da venda não encontrado');
      
      // For this implementation, we'll only allow updating the status
      const res = await apiRequest("PUT", `/api/sales/${initialData.id}`, {
        status: data.sale.status
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      toast({
        title: "Venda atualizada",
        description: "A venda foi atualizada com sucesso.",
      });
      navigate('/sales');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SaleFormData) => {
    if (isEdit && initialData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoading = isLoadingProducts || isLoadingCustomers;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sale.customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || ''}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sale.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Itens</h3>
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: 0, quantity: 1, price: 0 })}
                className="flex items-center"
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar Item
              </Button>
            )}
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                              handleProductChange(index, parseInt(value));
                            }}
                            defaultValue={field.value?.toString() || ''}
                            disabled={isEdit}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products?.map(product => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - {product.size} - {product.color}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qtd</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              disabled={isEdit}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-8 sm:col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              disabled={isEdit}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-9 sm:col-span-1 flex items-end">
                    <div className="w-full text-right">
                      <FormLabel className="opacity-0">Total</FormLabel>
                      <p className="text-sm font-medium">
                        {formatCurrency(
                          calculateTotal(
                            form.watch(`items.${index}.price`) || 0, 
                            form.watch(`items.${index}.quantity`) || 0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {!isEdit && fields.length > 1 && (
                    <div className="col-span-3 sm:col-span-1 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-9 w-9 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <span className="text-muted-foreground mr-2">Total da Venda:</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/sales')}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Salvando...' : isEdit ? 'Atualizar Venda' : 'Finalizar Venda'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
