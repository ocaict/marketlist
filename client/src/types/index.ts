export interface StatCardData {
  title: string;
  value: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  trend?: string;
  trendDirection?: 'up' | 'down';
}

export interface Product {
  id: string;
  categoryId: string | null;
  userId: string;
  name: string;
  category: string | null;
  sku: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'restock';
  productName: string;
  quantity: number;
  amount: number;
  date: string;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}
