'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CartItem, Order, OrderStatus, PaymentMethod, Address, AppUser } from '@/types' 
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext' 

interface OrderContextType {
  orders: Order[]
  addOrder: (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: AppUser | null,
    changeFor?: number
  ) => Promise<Order> 
  confirmDelivery: (orderId: string) => Promise<void>
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined)

const formatOrderFromDB = (order: any, user: AppUser | null): Order => ({
  id: order.id,
  items: order.items,
  totalPrice: order.total_price, 
  status: order.status,
  createdAt: new Date(order.created_at),
  paymentMethod: order.payment_method, 
  shippingAddress: order.shipping_address,
  user: user,
  changeFor: order.change_for
});


export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const { user } = useAuth() 

  useEffect(() => {
    if (!user) {
      setOrders([])
      return
    }

    const fetchOrders = async () => {
      console.log("A buscar pedidos do utilizador:", user.id)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', user.id) 
        .not('status', 'eq', 'archived') 
        .order('created_at', { ascending: false }) 

      if (error) {
        console.error("Erro ao buscar pedidos:", error)
        return
      }
      
      const formattedOrders: Order[] = data.map((order: any) => formatOrderFromDB(order, user));
      setOrders(formattedOrders)
    }

    fetchOrders()

    const subscription = supabase
      .channel(`pedidos-do-utilizador-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `profile_id=eq.${user.id}`
        },
        // --- CORREÇÃO 1: O LISTENER VAI IGNORAR O 'archived' ---
        (payload) => {
          console.log('Status do pedido atualizado (listener)!', payload.new);
          const updatedOrder = formatOrderFromDB(payload.new, user);

          // Se o status for 'archived', não fazemos nada.
          // A função 'confirmDelivery' (o clique) vai tratar de remover.
          if (updatedOrder.status === 'archived') {
            console.log('Listener a ignorar status "archived".');
            return; // Ignora a atualização para evitar a "corrida"
          }
          
          // Atualiza todos os outros status (pending, preparing, completed, etc.)
          setOrders((currentOrders) => 
            currentOrders.map(o => 
              o.id === updatedOrder.id ? updatedOrder : o
            )
          );
        }
        // --- FIM DA CORREÇÃO 1 ---
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }

  }, [user])


  const addOrder = async (
    // ... (função addOrder não muda) ...
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: AppUser | null,
    changeFor?: number
  ): Promise<Order> => {
    
    const newOrderForSupabase = {
      profile_id: user ? user.id : null,
      items: items, 
      total_price: totalPrice,
      shipping_address: shippingAddress, 
      payment_method: paymentMethod,
      change_for: changeFor || null,
      status: 'pending'
    }

    try {
      const { data: savedOrder, error } = await supabase
        .from('orders')
        .insert(newOrderForSupabase)
        .select() 
        .single() 

      if (error) throw error
      if (!savedOrder) throw new Error("Pedido não foi salvo.")

      const newOrderForLocalState = formatOrderFromDB(savedOrder, user);
      
      setOrders((prevOrders) => [newOrderForLocalState, ...prevOrders])
      
      return newOrderForLocalState; 

    } catch (err) {
      console.error("Falha ao processar 'addOrder':", err)
      throw err 
    }
  }

  // --- CORREÇÃO 2: A FUNÇÃO DE CLIQUE ATUALIZA O ESTADO ---
  const confirmDelivery = async (orderId: string) => {
    try {
      console.log(`A arquivar pedido (clique): ${orderId}`);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'archived' })
        .eq('id', orderId);

      if (error) {
        console.error("Erro no Supabase ao arquivar:", error);
        throw error;
      }

      // Adicionamos a atualização de estado local DE VOLTA
      // Agora é o clique (e não o listener) que remove o item.
      console.log(`A remover pedido do estado local: ${orderId}`);
      setOrders((currentOrders) => 
        currentOrders.filter(order => order.id !== orderId)
      );

    } catch (err) {
      console.error("Erro em confirmDelivery:", err);
      throw err;
    }
  }
  // --- FIM DA CORREÇÃO 2 ---


  return (
    <OrderContext.Provider value={{ orders, addOrder, confirmDelivery }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider')
  }
  return context
}