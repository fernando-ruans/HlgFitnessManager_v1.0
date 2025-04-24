import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency, getStockStatusClass, getCategoryLabel } from "@/lib/utils";
import { Product } from "@shared/schema";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  ShoppingBag, 
  ArrowLeft, 
  ArrowRight 
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const itemsPerPage = 10;
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  // Filter and sort products
  const filteredProducts = products
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (categoryFilter && categoryFilter !== "all" ? product.category === categoryFilter : true)
      )
    : [];
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "stock_asc":
        return a.stock - b.stock;
      case "stock_desc":
        return b.stock - a.stock;
      default:
        return 0;
    }
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <DashboardLayout
      title="Produtos"
      subtitle="Gerencie o catálogo de produtos da sua loja"
      action={
        <Button 
          className="bg-secondary text-white hover:bg-secondary-light" 
          onClick={() => navigate("/products/new")}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      }
    >
      {/* Search and filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="leggings">Leggings</SelectItem>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="shorts">Shorts</SelectItem>
                <SelectItem value="pants">Calças</SelectItem>
                <SelectItem value="accessories">Acessórios</SelectItem>
                <SelectItem value="shoes">Calçados</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[230px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="price_asc">Preço (menor-maior)</SelectItem>
                <SelectItem value="price_desc">Preço (maior-menor)</SelectItem>
                <SelectItem value="stock_asc">Estoque (menor-maior)</SelectItem>
                <SelectItem value="stock_desc">Estoque (maior-menor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      {/* Products list */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : paginatedProducts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral">
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {product.image ? (
                              <img 
                                className="h-10 w-10 rounded object-cover" 
                                src={`/${product.image}`} 
                                alt={product.name} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-neutral flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary">{product.name}</div>
                            <div className="text-xs text-primary-light">
                              Tamanho {product.size} • {product.color}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground font-medium">{getCategoryLabel(product.category)}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getStockStatusClass(product.stock, product.minStock)}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <Edit2 className="h-4 w-4 text-primary-light hover:text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir produto</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o produto "{product.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="py-4 px-6 flex justify-between items-center border-t">
                <div className="text-sm text-primary-light">
                  Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, sortedProducts.length)}
                  </span>{" "}
                  de <span className="font-medium">{sortedProducts.length}</span> resultados
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 ? setCurrentPage(p => p - 1) : null}
                        className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum > totalPages) return null;
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === currentPage}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages ? setCurrentPage(p => p + 1) : null}
                        className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Nenhum produto encontrado"
            description={searchQuery || categoryFilter ? "Tente mudar os filtros de busca" : "Comece adicionando seu primeiro produto"}
            actionLabel="Adicionar Produto"
            onAction={() => navigate("/products/new")}
            icon={<ShoppingBag className="h-10 w-10" />}
            className="py-12"
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
