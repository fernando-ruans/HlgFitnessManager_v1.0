import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toLocaleDateString('pt-BR');
}

export function formatDateTime(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateTotal(price: number, quantity: number): number {
  return parseFloat((price * quantity).toFixed(2));
}

export const categoryOptions = [
  { value: 'leggings', label: 'Leggings' },
  { value: 'tops', label: 'Tops' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'pants', label: 'Calças' },
  { value: 'accessories', label: 'Acessórios' },
  { value: 'shoes', label: 'Calçados' },
  { value: 'other', label: 'Outros' }
];

export const sizeOptions = [
  { value: 'PP', label: 'PP' },
  { value: 'P', label: 'P' },
  { value: 'M', label: 'M' },
  { value: 'G', label: 'G' },
  { value: 'GG', label: 'GG' },
  { value: 'XGG', label: 'XGG' },
  { value: '34', label: '34' },
  { value: '36', label: '36' },
  { value: '38', label: '38' },
  { value: '40', label: '40' },
  { value: '42', label: '42' },
  { value: '44', label: '44' },
  { value: 'Único', label: 'Único' }
];

export const statusOptions = [
  { value: 'completed', label: 'Concluída' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelada' }
];

export function getCategoryLabel(value: string): string {
  const category = categoryOptions.find(c => c.value === value);
  return category ? category.label : value;
}

export function getSizeLabel(value: string): string {
  const size = sizeOptions.find(s => s.value === value);
  return size ? size.label : value;
}

export function getStatusLabel(value: string): string {
  const status = statusOptions.find(s => s.value === value);
  return status ? status.label : value;
}

export function getStatusClass(status: string): string {
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

export function getStockStatusClass(stock: number, minStock: number): string {
  if (stock <= 0) return 'text-danger font-medium';
  if (stock <= minStock) return 'text-warning font-medium';
  return 'text-success font-medium';
}
