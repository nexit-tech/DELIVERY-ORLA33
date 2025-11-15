// types/index.ts

// --- TIPOS DO SUPABASE (BASEADOS NO TEU SQL) ---

export interface SupabaseCategory {
  id: string
  name: string
  created_at?: string
}

export interface SupabaseProduct {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number // O Supabase trata 'numeric' como 'number'
  promo_price: number | null
  image_url: string | null
  created_at?: string
}

export interface SupabaseCombo {
  id: string
  name: string
  base_price: number
  description: string | null
  image_url: string | null
  created_at?: string
}

export interface SupabaseComboGroup {
  id: string
  combo_id: string
  name: string
  created_at?: string
  type?: 'single' | 'multiple'
  max_selection?: number
}

export interface SupabaseComboGroupItem {
  id: string
  group_id: string
  product_id: string
  additional_price: number
  created_at?: string
  products: Pick<SupabaseProduct, 'name' | 'description'> 
}


// --- TIPOS DO PROTÓTIPO (Para o UI) ---

export interface DisplayProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  type: 'product' | 'combo'
  category_id: string | null
}

export interface ComplementOption {
  id: string
  name: string
  price: number
}

export interface ComplementCategory {
  id: string
  name: string
  type: 'single' | 'multiple'
  maxSelection: number
  options: ComplementOption[]
}

// --- Tipos de Contextos (Auth, Cart, Order) ---

// 1. ADICIONADO O NOVO STATUS 'archived'
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled' | 'archived'
export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix' | 'none'

export interface Address {
  id: string
  name: string
  street: string
  number: string
  neighborhood: string
  complement?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  addresses: Address[]
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  complements?: ComplementCategory[];
}

export interface CartItem {
  id: string 
  product: Product
  quantity: number
  selectedComplements: { [categoryId: string]: ComplementOption[] }
  unitPrice: number
  observation?: string
}

export interface Order {
  id: string
  items: CartItem[]
  totalPrice: number
  status: OrderStatus
  createdAt: Date
  paymentMethod: PaymentMethod
  changeFor?: number
  shippingAddress: Address
  user: User | null
}