import { AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import LowStockItem from './low-stock-item';
import { Product } from '@shared/schema';

interface LowStockProductsProps {
  products?: Product[];
  loading?: boolean;
}

export default function LowStockProducts({ products = [], loading = false }: LowStockProductsProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Produtos com Estoque Baixo</h2>
          <Link href="/products" className="text-secondary text-sm hover:underline">
            Ver todos
          </Link>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-white">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-white opacity-70" />
            <p>Carregando produtos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products && products.length > 0 ? (
              products.slice(0, 3).map((product) => (
                <LowStockItem key={product.id} product={product} />
              ))
            ) : (
              <div className="p-6 text-center text-white">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-white opacity-70" />
                <p>Nenhum produto com estoque baixo encontrado</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}