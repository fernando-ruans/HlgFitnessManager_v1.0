import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import ProductForm from "@/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const isEditMode = !!id && id !== "new";
  
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: isEditMode,
  });
  
  const pageTitle = isEditMode 
    ? (product ? `Editar Produto: ${product.name}` : "Editar Produto") 
    : "Adicionar Produto";
  
  return (
    <DashboardLayout
      title={pageTitle}
      action={
        <Button 
          variant="outline" 
          onClick={() => navigate("/products")}
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
            <ProductForm initialData={product} isEdit={isEditMode} />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
