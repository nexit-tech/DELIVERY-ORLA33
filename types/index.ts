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

// (Assume que adicionaste description e image_url à tua tabela 'combos')
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
  name: string // Ex: "Escolha seu molho"
  created_at?: string
  // NOTA: Adicionar 'type' ('single'/'multiple') e 'max_selection' (number)
  // ao teu schema 'combo_groups' no Supabase para o modal funcionar 100%
  type?: 'single' | 'multiple'
  max_selection?: number
}

export interface SupabaseComboGroupItem {
  id: string
  group_id: string
  product_id: string
  additional_price: number
  created_at?: string
  // O Supabase faz o join disto
  products: Pick<SupabaseProduct, 'name' | 'description'> 
}


// --- TIPOS DO PROTÓTIPO (Para o UI) ---

// Este é o tipo que o ProductCard vai usar
export interface DisplayProduct {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  type: 'product' | 'combo'
  category_id: string | null // <-- CAMPO-CHAVE PARA O FILTRO
}

// Tipos de Complementos (adaptados do Supabase)
export interface ComplementOption {
  id: string // Vem do product_id no combo_group_items
  name: string
  price: number // Vem do additional_price no combo_group_items
}

export interface ComplementCategory {
  id: string // Vem do combo_group (group_id)
  name: string // Vem do combo_group
  type: 'single' | 'multiple' // Assumindo que o user adicionará no Supabase
  maxSelection: number // Assumindo que o user adicionará no Supabase
  options: ComplementOption[]
}

// --- Tipos de Contextos (Auth, Cart, Order) ---

export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled'
export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix' | 'none'

export interface Address {
  id: string
  name: string // Ex: "Casa", "Trabalho"
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

// O `Product` aqui é o tipo "antigo" que o CartContext espera
// O `ProductDetailsModal` adapta o `DisplayProduct` para este tipo ao adicionar
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // no `addToCart` usamos `image_url` para isto
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