'use client'

import { ShoppingCart, User, Package } from 'lucide-react'
import styles from './styles.module.css'
import { useCart } from '@/context/CartContext'
import { useOrders } from '@/context/OrderContext'

// 1. A prop 'onProfileClick' TEM de estar aqui
interface NavbarProps {
  onCartClick: () => void
  onOrdersClick: () => void 
  onProfileClick: () => void // <-- ESSENCIAL
}

export default function Navbar({ 
  onCartClick, 
  onOrdersClick, 
  onProfileClick // <-- ESSENCIAL
}: NavbarProps) {
  const { cartItems } = useCart() 
  const { orders } = useOrders()
  const activeItem = 'home' 

  const totalCartItems = cartItems.length 

  const activeOrdersCount = (orders || []).filter(
    (order: any) => order.status !== 'completed' && order.status !== 'cancelled'
  ).length

  return (
    <nav className={styles.navbar}>
      <button
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
        onClick={onProfileClick} // <-- 2. O 'onClick' TEM de estar a chamar a prop
      >
        <div className={styles.iconWrapper}>
          <User size={24} strokeWidth={2.5} />
        </div>
        <span>Perfil</span>
      </button>
    </nav>
  )
}