import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import CustomerForm from "@/components/customer-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Customer } from "@shared/schema";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const isEditMode = !!id && id !== "new";
  
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${id}`],
    enabled: isEditMode,
  });
  
  const pageTitle = isEditMode 
    ? (customer ? `Editar Cliente: ${customer.name}` : "Editar Cliente") 
    : "Adicionar Cliente";
  
  return (
    <DashboardLayout
      title={pageTitle}
      action={
        <Button 
          variant="outline" 
          onClick={() => navigate("/customers")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      }
    >
      <Card>
        <CardContent className="p-6">
          {isEditMode && isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : (
            <CustomerForm initialData={customer} isEdit={isEditMode} />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
