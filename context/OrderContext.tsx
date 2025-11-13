'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { CartItem, Order, OrderStatus, PaymentMethod, Address, User } from '@/types'

interface OrderContextType {
  orders: Order[]
  addOrder: (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: User | null,
    changeFor?: number
  ) => void
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined)

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([])

  // 1. FUNÇÃO INTERNA PARA ATUALIZAR O STATUS
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status: status } : order
      )
    )
  }

  const addOrder = (
    items: CartItem[], 
    totalPrice: number, 
    paymentMethod: PaymentMethod, 
    shippingAddress: Address,
    user: User | null,
    changeFor?: number
  ) => {
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      items: items,
      totalPrice: totalPrice,
      status: 'pending', // Começa como "pending"
      createdAt: new Date(),
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress,
      user: user,
      changeFor: changeFor
    }

    setOrders((prevOrders) => [newOrder, ...prevOrders])

    // 2. SIMULAÇÃO: MUDAR PARA "EM PREPARO" DEPOIS DE 10 SEGUNDOS
    setTimeout(() => {
      console.log(`Simulando: Pedido ${newOrder.id} mudou para 'Em preparo'`)
      updateOrderStatus(newOrder.id, 'preparing')
    }, 10000) // 10 segundos
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder }}>
      {children}
    </OrderContext.Provider>
  )
}

// Hook customizado
export const useOrders = () => {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error('useOrders deve ser usado dentro de um OrderProvider')
  }
  return context
}