import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Sale, Customer } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface RecentSalesProps {
  sales?: Sale[];
  customers?: Customer[];
  loading?: boolean;
}

export default function RecentSales({ sales = [], customers = [], loading = false }: RecentSalesProps) {
  
  function getCustomerName(customerId: number): string {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "Cliente";
  }
  
  function getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-danger';
      default:
        return '';
    }
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Vendas Recentes</h2>
          <Link href="/sales" className="text-secondary text-sm hover:underline">
            Ver todas
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-white opacity-80 tracking-wider">Cliente</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white opacity-80 tracking-wider">Produtos</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-white opacity-80 tracking-wider">Valor</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-white opacity-80 tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-white">
                    Carregando vendas...
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-white">
                          {getCustomerName(sale.customerId)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-white opacity-80">
                      {/* Placeholder for items count */}
                      {Math.floor(Math.random() * 5) + 1} itens
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className={getStatusClass(sale.status)}>
                        {sale.status === 'completed' ? 'Concluída' : 
                          sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-white opacity-80">
                    Nenhuma venda recente encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}