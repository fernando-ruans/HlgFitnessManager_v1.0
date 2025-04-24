import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Customer } from "@shared/schema";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Users, 
  User as UserIcon,
  Mail, 
  Phone,
  MapPin
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const itemsPerPage = 10;
  
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };
  
  // Filter and sort customers
  const filteredCustomers = customers
    ? customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customer.phone && customer.phone.includes(searchQuery))
      )
    : [];
  
  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortOrder) {
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <DashboardLayout
      title="Clientes"
      subtitle="Gerencie os clientes da sua loja"
      action={
        <Button 
          className="bg-secondary text-white hover:bg-secondary-light" 
          onClick={() => navigate("/customers/new")}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
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
              placeholder="Buscar por nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
      
      {/* Customers list */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          </div>
        ) : paginatedCustomers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral">
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-neutral rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary-light" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{customer.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-xs text-primary-light">
                              <Mail className="mr-1 h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-xs text-primary-light">
                              <Phone className="mr-1 h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.address ? (
                          <div className="flex items-center text-xs text-primary-light">
                            <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-2">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum endereço cadastrado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/customers/${customer.id}`)}
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
                                <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cliente "{customer.name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                  onClick={() => handleDelete(customer.id)}
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
                    {Math.min(currentPage * itemsPerPage, sortedCustomers.length)}
                  </span>{" "}
                  de <span className="font-medium">{sortedCustomers.length}</span> resultados
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="cursor-pointer"
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
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Nenhum cliente encontrado"
            description={searchQuery ? "Tente mudar os termos de busca" : "Comece adicionando seu primeiro cliente"}
            actionLabel="Adicionar Cliente"
            onAction={() => navigate("/customers/new")}
            icon={<Users className="h-10 w-10" />}
            className="py-12"
          />
        )}
      </Card>
    </DashboardLayout>
  );
}
