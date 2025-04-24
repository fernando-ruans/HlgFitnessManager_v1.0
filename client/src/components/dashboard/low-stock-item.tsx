import { ShoppingBag } from 'lucide-react';
import { Link } from 'wouter';
import { Product } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface LowStockItemProps {
  product: Product;
}

export default function LowStockItem({ product }: LowStockItemProps) {
  return (
    <div className="flex items-center p-3 border border-neutral rounded-lg">
      <div className="h-14 w-14 flex-shrink-0 rounded bg-neutral-light flex items-center justify-center">
        {product.image ? (
          <img 
            src={`/${product.image}`} 
            alt={product.name} 
            className="h-12 w-12 object-cover"
          />
        ) : (
          <ShoppingBag className="h-6 w-6 text-white" />
        )}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-white">{product.name}</p>
            <p className="text-xs text-white opacity-80">
              Tamanho {product.size} • {product.color}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium bg-danger text-white px-2 py-1 rounded-full">
              {product.stock} un.
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-medium text-white">{formatCurrency(product.price)}</p>
          <Link 
            href={`/products/${product.id}`}
            className="text-white bg-secondary px-3 py-1 rounded text-xs font-medium hover:bg-secondary-light transition"
          >
            Repor estoque
          </Link>
        </div>
      </div>
    </div>
  );
}