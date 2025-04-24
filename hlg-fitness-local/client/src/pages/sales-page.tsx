import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusClass } from "@/lib/utils";
import { Sale, Customer } from "@shared/schema";
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Loader2, 
  ShoppingCart, 
  Calendar
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";

export default function SalesPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const itemsPerPage = 10;
  
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ['/api/sales'],
  });
  
  const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  const getCustomerName = (customerId: number): string => {
    if (!customers) return "Cliente";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Cliente";
  };
  
  // Filter sales
  const filteredSales = sales
    ? sales.filter(
        (sale) => {
          // Status filter
          if (statusFilter && statusFilter !== "all" && sale.status !== statusFilter) {
            return false;
          }
          
          // Date filter
          if (dateFilter) {
            const saleDate = new Date(sale.date);
            const filterDate = new Date(dateFilter);
            
            if (
              saleDate.getFullYear() !== filterDate.getFullYear() ||
              saleDate.getMonth() !== filterDate.getMonth() ||
              saleDate.getDate() !== filterDate.getDate()
            ) {
              return false;
            }
          }
          
          // Search by customer
          if (searchQuery) {
            const customer = customers?.find(c => c.id === sale.customerId);
            if (!customer || !customer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
              return false;
            }
          }
          
          return true;
        }
      )
    : [];
  
  // Sort sales by date (newest first)
  const sortedSales = [...filteredSales].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedSales = sortedSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const isLoading = isLoadingSales || isLoadingCustomers;
  
  return (
    <DashboardLayout
      title="Vendas"
      subtitle="Gerencie as vendas da sua loja"
      action={
        <Button 
          className="bg-secondary text-white hover:bg-secondary-light" 
          onClick={() => navigate("/sales/new")}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Venda
        </Button>
      }
    >
      {/* Search and filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar por cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <DatePicker 
                date={dateFilter} 
                setDate={setDateFilter} 
                placeholder="Filtrar por data"
              />
              
              {dateFilter && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDateFilter(undefined)}
                  className="h-10 w-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Sales list */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : paginatedSales.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>#{sale.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{getCustomerName(sale.customerId)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(sale.date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={
                            sale.status === 'completed' ? 'success' :
                            sale.status === 'pending' ? 'warning' : 'destructive'
                          }
                          className="font-medium text-white"
                        >
                          {sale.status === 'completed' ? 'Concluída' : 
                           sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/sales/${sale.id}`)}
                          >
                            <Eye className="h-4 w-4 text-primary-light hover:text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir venda</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a venda #{sale.id}? Esta ação não pode ser desfeita e o estoque dos produtos será restaurado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                  onClick={() => handleDelete(sale.id)}
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
                    {Math.min(currentPage * itemsPerPage, sortedSales.length)}
                  </span>{" "}
                  de <span className="font-medium">{sortedSales.length}</span> resultados
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
            title="Nenhuma venda encontrada"
            description={searchQuery || statusFilter || dateFilter ? "Tente mudar os filtros de busca" : "Comece registrando sua primeira venda"}
            actionLabel="Registrar Venda"
            onAction={() => navigate("/sales/new")}
            icon={<ShoppingCart className="h-10 w-10" />}
            className="py-12"
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
