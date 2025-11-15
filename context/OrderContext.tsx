'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { CartItem, Order, OrderStatus, PaymentMethod, Address, User } from '@/types'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext' 

interface OrderContextType {
  orders: Order[]
  addOrder: (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: User | null,
    changeFor?: number
  ) => Promise<Order> // <-- 1. MUDANÇA AQUI (agora retorna 'Order')
  confirmDelivery: (orderId: string) => Promise<void>
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined)

const formatOrderFromDB = (order: any, user: User | null): Order => ({
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

  // ... (useEffect de busca e realtime permanece o mesmo) ...
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
      
      const formattedOrders: Order[] = data.map(order => formatOrderFromDB(order, user));
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
        (payload) => {
          console.log('Status do pedido atualizado!', payload.new);
          const updatedOrder = formatOrderFromDB(payload.new, user);

          if (updatedOrder.status === 'archived') {
            setOrders((currentOrders) => 
              currentOrders.filter(o => o.id !== updatedOrder.id)
            );
          } else {
            setOrders((currentOrders) => 
              currentOrders.map(o => 
                o.id === updatedOrder.id ? updatedOrder : o
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }

  }, [user])


  // 2. FUNÇÃO addOrder ATUALIZADA
  const addOrder = async (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: User | null,
    changeFor?: number
  ): Promise<Order> => { // <-- MUDANÇA AQUI (define o tipo de retorno)
    
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
      
      return newOrderForLocalState; // <-- 3. A LINHA MÁGICA QUE FALTAVA!

    } catch (err) {
      console.error("Falha ao processar 'addOrder':", err)
      throw err 
    }
  }

  // ... (confirmDelivery permanece o mesmo) ...
  const confirmDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'archived' })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((currentOrders) => 
        currentOrders.filter(order => order.id !== orderId)
      );
    } catch (err) {
      console.error("Erro em confirmDelivery:", err);
      throw err;
    }
  }

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