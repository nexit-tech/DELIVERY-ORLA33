'use client'

import { ShoppingCart, User, Package } from 'lucide-react'
import styles from './styles.module.css'
import { useCart } from '@/context/CartContext'
import { useOrders } from '@/context/OrderContext'
import { Order } from '@/types' // <-- MUDANÇA 1: Importar o tipo 'Order'

// A interface (props) não muda
interface NavbarProps {
  onCartClick: () => void
  onOrdersClick: () => void 
  onProfileClick: () => void
}

export default function Navbar({ 
  onCartClick, 
  onOrdersClick, 
  onProfileClick 
}: NavbarProps) {
  const { cartItems } = useCart() 
  const { orders } = useOrders()
  
  // --- MUDANÇA 2: AVISAR AO TYPESCRIPT QUE 'activeItem' É UMA STRING GENÉRICA ---
  const activeItem: string = 'home' 
  // -------------------------------------------------------------------------

  const totalCartItems = cartItems.length 

  // --- MUDANÇA 3: SUBSTITUIR '(order: any)' por '(order: Order)' ---
  const activeOrdersCount = (orders || []).filter(
    (order: Order) => order.status !== 'completed' && order.status !== 'cancelled'
  ).length
  // ----------------------------------------------------------------

  return (
    <nav className={styles.navbar}>
      <button
        // Agora 'activeItem' (string) === 'cart' (string) é uma comparação válida
        className={`${styles.navItem} ${activeItem === 'cart' ? styles.active : ''}`}
        aria-label="Carrinho"
        onClick={onCartClick} 
      >
        <div className={styles.iconWrapper}> 
          <ShoppingCart size={24} strokeWidth={2.5} />
          {totalCartItems > 0 && (
            <span className={styles.cartBadge}>{totalCartItems}</span>
          )}
        </div>
        <span>Carrinho</span>
      </button>

      <button
        className={`${styles.navItem} ${activeItem === 'order' ? styles.active : ''}`}
        aria-label="Acompanhar Pedido"
        onClick={onOrdersClick}
      >
        <div className={styles.iconWrapper}>
          <Package size={24} strokeWidth={2.5} />
          {activeOrdersCount > 0 && (
            <span className={styles.cartBadge}>{activeOrdersCount}</span>
          )}
        </div>
        <span>Pedido</span>
      </button>

      <button
        className={`${styles.navItem} ${activeItem === 'profile' ? styles.active : ''}`}
        aria-label="Perfil"
        onClick={onProfileClick}
      >
        <div className={styles.iconWrapper}>
          <User size={24} strokeWidth={2.5} />
        </div>
        <span>Perfil</span>
      </button>
    </nav>
  )
}