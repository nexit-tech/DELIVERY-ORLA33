'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, ComplementOption, CartItem } from '@/types'

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (
    product: Product,
    quantity: number,
    selectedComplements: { [categoryId: string]: ComplementOption[] },
    observation: string
  ) => void
  removeFromCart: (cartItemId: string) => void
  clearCart: () => void
  updateItemQuantity: (cartItemId: string, newQuantity: number) => void // <-- 1. ADICIONADO
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addToCart = (
    product: Product,
    quantity: number,
    selectedComplements: { [categoryId: string]: ComplementOption[] },
    observation: string
  ) => {
    
    let complementsPrice = 0
    Object.values(selectedComplements).forEach((options) => {
      options.forEach((option) => {
        complementsPrice += option.price
      })
    })
    const unitPrice = product.price + complementsPrice

    const newCartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product: product,
      quantity: quantity,
      selectedComplements: selectedComplements,
      unitPrice: unitPrice,
      observation: observation.trim() ? observation.trim() : undefined,
    }

    setCartItems((prevItems) => [...prevItems, newCartItem])
  }

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) => 
      prevItems.filter(item => item.id !== cartItemId)
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  // 2. FUNÇÃO PARA ATUALIZAR QUANTIDADE
  const updateItemQuantity = (cartItemId: string, newQuantity: number) => {
    // Se a quantidade for 0 ou menos, remove o item
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    // Caso contrário, atualiza a quantidade
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        clearCart, 
        updateItemQuantity // <-- 3. EXPOR A FUNÇÃO
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Hook customizado
export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}