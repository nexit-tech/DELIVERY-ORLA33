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

// formatOrderFromDB AGORA SÓ É USADO PARA PEDIDOS NOVOS (com 'items')
const formatOrderFromDB = (order: any, user: AppUser | null): Order => ({
  id: order.id,
  items: order.items, // 'items' VÊM DA BUSCA INICIAL ou do ADDORDER
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

    // A Busca Inicial (fetchOrders) funciona bem
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
        // --- CORREÇÃO: O LISTENER VAI "MESCLAR" O ESTADO ---
        (payload) => {
          console.log('Status do pedido atualizado (listener)!', payload.new);
          
          // O 'payload.new' SÓ TEM o ID e o novo STATUS
          const newStatus = payload.new.status;
          const orderId = payload.new.id;

          // Se o status for 'archived', removemos o pedido da lista
          if (newStatus === 'archived') {
            console.log('Listener a remover pedido "archived".');
             setOrders((currentOrders) => 
               currentOrders.filter(o => o.id !== orderId)
             );
            return; 
          }
          
          // SE FOR OUTRO STATUS ('preparing', 'delivering', 'completed'):
          // Nós ATUALIZAMOS o pedido, mas preservando os 'items'
          setOrders((currentOrders) => 
            currentOrders.map(order => 
              // Se o ID for o mesmo...
              order.id === orderId 
                // ...mantemos o pedido antigo (...order) e SÓ mudamos o status
                ? { ...order, status: newStatus } 
                // ...senão, mantemos o pedido como está
                : order
            )
          );
        }
        // --- FIM DA CORREÇÃO ---
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }

  }, [user])


  const addOrder = async (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: AppUser | null,
    changeFor?: number
  ): Promise<Order> => {
    
    const newOrderForSupabase = {
      profile_id: user ? user.id : null,
      items: items, // 'items' SÃO ENVIADOS AQUI
      total_price: totalPrice,
      shipping_address: shippingAddress, 
      payment_method: paymentMethod,
      change_for: changeFor || null,
      status: 'pending' // Começa como pendente
    }

    try {
      const { data: savedOrder, error } = await supabase
        .from('orders')
        .insert(newOrderForSupabase)
        .select() 
        .single() 

      if (error) throw error
      if (!savedOrder) throw new Error("Pedido não foi salvo.")

      // O 'savedOrder' retorna do Supabase com os 'items'
      const newOrderForLocalState = formatOrderFromDB(savedOrder, user);
      
      // Adiciona o novo pedido (com 'items') ao estado local
      setOrders((prevOrders) => [newOrderForLocalState, ...prevOrders])
      
      return newOrderForLocalState; 

    } catch (err) {
      console.error("Falha ao processar 'addOrder':", err)
      throw err 
    }
  }

  // Esta função não é mais usada (o Cron Job faz o trabalho),
  // mas vamos mantê-la correta.
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

      // O listener (agora corrigido) vai tratar de remover
      // setOrders((currentOrders) => 
      //   currentOrders.filter(order => order.id !== orderId)
      // ); // <-- REMOVIDO (DE NOVO) para deixar o listener fazer

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