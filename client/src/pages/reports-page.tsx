import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { generateSalesReport, generateInventoryReport } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Sale, Product } from "@shared/schema";
import { Loader2, Download, FileText, BarChart, Calendar, ShoppingBag, TrendingUp, Share2 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isGeneratingSales, setIsGeneratingSales] = useState(false);
  const [isGeneratingInventory, setIsGeneratingInventory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  
  // Detectar se estamos em um dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkIfMobile();
    
    // Também verificar quando redimensionar a janela
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  const { data: sales, isLoading: isLoadingSales } = useQuery<Sale[]>({
    queryKey: ['/api/sales'],
  });
  
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  const handleGenerateSalesReport = async () => {
    if (!startDate || !endDate || !sales) {
      toast({
        title: "Erro",
        description: "Selecione o período para gerar o relatório",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingSales(true);
      
      // Filter sales by date range
      const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startOfDay(startDate) && saleDate <= endOfDay(endDate);
      });
      
      const filename = await generateSalesReport(filteredSales, startDate, endDate);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: `O relatório ${filename} foi gerado e baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório de vendas.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsGeneratingSales(false);
    }
  };
  
  const handleGenerateInventoryReport = async () => {
    if (!products) {
      toast({
        title: "Erro",
        description: "Não foi possível obter os produtos para o relatório",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsGeneratingInventory(true);
      
      const filename = await generateInventoryReport(products);
      
      toast({
        title: "Relatório gerado com sucesso",
        description: `O relatório ${filename} foi gerado e baixado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório de estoque.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsGeneratingInventory(false);
    }
  };
  
  // Calculate sales statistics
  const salesStats = {
    total: 0,
    count: 0,
    average: 0
  };
  
  if (sales && startDate && endDate) {
    const filteredSales = sales.filter(sale => {
      if (sale.status === "cancelled") return false;
      
      const saleDate = new Date(sale.date);
      return saleDate >= startOfDay(startDate) && saleDate <= endOfDay(endDate);
    });
    
    salesStats.total = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    salesStats.count = filteredSales.length;
    salesStats.average = salesStats.count > 0 ? salesStats.total / salesStats.count : 0;
  }
  
  // Calculate inventory statistics
  const inventoryStats = {
    total: 0,
    itemsCount: 0,
    lowStockCount: 0,
    inventoryValue: 0
  };
  
  if (products) {
    inventoryStats.itemsCount = products.length;
    inventoryStats.lowStockCount = products.filter(product => product.stock <= product.minStock).length;
    inventoryStats.inventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  }
  
  const isLoading = isLoadingSales || isLoadingProducts;
  
  return (
    <DashboardLayout
      title="Relatórios"
      subtitle="Gere relatórios e visualize estatísticas da sua loja"
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-secondary" />
                  <div className="text-2xl font-bold">{formatCurrency(salesStats.total)}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                {startDate && endDate && (
                  <span>
                    Período: {format(startDate, "P", { locale: ptBR })} - {format(endDate, "P", { locale: ptBR })}
                  </span>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Número de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  <div className="text-2xl font-bold">{salesStats.count}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(salesStats.average)}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor do Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-warning" />
                  <div className="text-2xl font-bold">{formatCurrency(inventoryStats.inventoryValue)}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 text-xs text-muted-foreground">
                {inventoryStats.itemsCount} produtos ({inventoryStats.lowStockCount} com estoque baixo)
              </CardFooter>
            </Card>
          </div>
          
          {/* Sales report */}
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                Gere um relatório detalhado de vendas para um período específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Início</label>
                  <DatePicker date={startDate} setDate={setStartDate} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Fim</label>
                  <DatePicker date={endDate} setDate={setEndDate} />
                </div>
              </div>
              
              <div className="p-4 bg-neutral rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Informações do Relatório</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  O relatório irá incluir todas as vendas realizadas no período selecionado, com detalhes de produtos, clientes e valores.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-sm text-muted-foreground">
                {startDate && endDate && (
                  <span>
                    Período: {format(startDate, "P", { locale: ptBR })} - {format(endDate, "P", { locale: ptBR })}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-secondary text-white hover:bg-secondary-light"
                  onClick={handleGenerateSalesReport}
                  disabled={isGeneratingSales || !startDate || !endDate}
                >
                  {isGeneratingSales ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingSales ? "Gerando..." : (isMobile ? "Ver PDF" : "Gerar PDF")}
                </Button>
                
                {isMobile && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Informação",
                        description: "Ao gerar o PDF, ele será aberto automaticamente em uma nova aba.",
                      });
                    }}
                    type="button"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Ajuda
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
          
          {/* Inventory report */}
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Estoque</CardTitle>
              <CardDescription>
                Gere um relatório detalhado do estoque atual da loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-neutral rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Informações do Relatório</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  O relatório irá incluir todos os produtos cadastrados, com informações de quantidade em estoque, valor, e alertas para produtos com estoque abaixo do mínimo.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-sm text-muted-foreground">
                Total de produtos: {inventoryStats.itemsCount} ({inventoryStats.lowStockCount} com estoque baixo)
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-secondary text-white hover:bg-secondary-light"
                  onClick={handleGenerateInventoryReport}
                  disabled={isGeneratingInventory}
                >
                  {isGeneratingInventory ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingInventory ? "Gerando..." : (isMobile ? "Ver PDF" : "Gerar PDF")}
                </Button>
                
                {isMobile && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Informação",
                        description: "Ao gerar o PDF, ele será aberto automaticamente em uma nova aba.",
                      });
                    }}
                    type="button"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Ajuda
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
