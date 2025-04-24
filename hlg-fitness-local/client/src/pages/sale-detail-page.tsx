import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import SaleForm from "@/components/sale-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SaleWithItems } from "@shared/schema";

export default function SaleDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const isEditMode = !!id && id !== "new";
  
  const { data: sale, isLoading } = useQuery<SaleWithItems>({
    queryKey: [`/api/sales/${id}`],
    enabled: isEditMode,
  });
  
  const pageTitle = isEditMode 
    ? `Detalhes da Venda #${id}` 
    : "Registrar Nova Venda";
  
  return (
    <DashboardLayout
      title={pageTitle}
      action={
        <Button 
          variant="outline" 
          onClick={() => navigate("/sales")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      }
    >
      {isEditMode && isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : (
        <SaleForm initialData={sale} isEdit={isEditMode} />
      )}
    </DashboardLayout>
  );
}
