'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { X, Trash2 } from 'lucide-react'
import styles from './styles.module.css'
import { ComplementOption } from '@/types'

interface CartModalProps {
  onClose: () => void
  onCheckoutSuccess: () => void
}

export default function CartModal({ onClose, onCheckoutSuccess }: CartModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // 1. OBTER AS NOVAS FUNÇÕES
  const { cartItems, removeFromCart, updateItemQuantity } = useCart()

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    document.body.classList.add(styles.modalOpen);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const subtotal = cartItems.reduce((total, item) => {
    return total + item.unitPrice * item.quantity
  }, 0)

  const formatComplements = (complements: { [key: string]: ComplementOption[] }) => {
    return Object.values(complements)
      .flat()
      .filter(opt => opt.price > 0 || opt.name.toLowerCase() !== 'sem molho') 
      .map(opt => opt.name)
      .join(', ')
  }

  const handleCheckout = () => {
    handleClose() 
    onCheckoutSuccess()
  }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Meu Carrinho</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.cartItemsList}>
          {cartItems.length === 0 ? (
            <p className={styles.emptyMessage}>Seu carrinho está vazio.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <img src={item.product.image} alt={item.product.name} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  
                  {/* 2. SUBSTITUIR O SPAN PELO CONTROLO DE QUANTIDADE */}
                  <div className={styles.quantityControl}>
                    <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  
                  <div className={styles.itemNameAndComplements}>
                    <h4 className={styles.itemName}>{item.product.name}</h4>
                    <p className={styles.itemComplements}>
                      {formatComplements(item.selectedComplements)}
                    </p>
                    {item.observation && (
                      <p className={styles.itemObservation}>
                        Obs: "{item.observation}"
                      </p>
                    )}
                  </div>
                  <span className={styles.itemPrice}>
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                  <button 
                    className={styles.removeButton} 
                    aria-label="Remover item"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.subtotal}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <button 
            className={styles.checkoutButton} 
            disabled={cartItems.length === 0}
            onClick={handleCheckout}
          >
            Finalizar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}