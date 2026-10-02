export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  business_name: string;
  password_hash: string;
}

export interface CreateCategoryInput {
  user_id: string;
  name: string;
}

export interface CreateProductInput {
  user_id: string;
  category_id?: string;
  name: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  image_url?: string;
}

export interface CreateSaleInput {
  user_id: string;
  total_amount: number;
  payment_method?: string;
}

export interface CreateSaleItemInput {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
