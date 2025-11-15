'use client'

import { useState, useEffect } from 'react'
import { useOrders } from '@/context/OrderContext' 
import { Order, OrderStatus } from '@/types'
import { X, ShoppingBag } from 'lucide-react'
import styles from './styles.module.css'

interface OrdersModalProps {
  onClose: () => void
}

const getStatusInfo = (status: OrderStatus): { text: string; description: string } => {
  switch (status) {
    case 'pending':
      return { text: 'Em análise', description: 'O restaurante ainda não aceitou seu pedido.' }
    case 'preparing':
      return { text: 'Em preparo', description: 'Seu pedido está sendo preparado!' }
    case 'delivering':
      return { text: 'Em entrega', description: 'O pedido saiu para entrega.' }
    case 'completed': 
      return { text: 'Entregue', description: 'Seu pedido foi entregue.' } 
    case 'cancelled':
      return { text: 'Cancelado', description: 'O pedido foi cancelado.' }
    default:
      return { text: 'Status', description: '...' }
  }
}

export default function OrdersModal({ onClose }: OrdersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { orders, confirmDelivery } = useOrders()
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // --- FUNÇÃO DE CONFIRMAR CORRIGIDA ---
  const handleConfirm = async (orderId: string) => {
    setLoadingOrderId(orderId); // Ativa o loading
    try {
      await confirmDelivery(orderId);
      // O OrderContext vai remover o item da lista
      // e este componente vai re-renderizar sem o card.
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar a entrega. Tente novamente.");
    } finally {
      // Adicionamos o 'finally' de volta.
      // Como não há mais "corrida" (o listener ignora),
      // é seguro resetar o loading quando a função (sucesso ou erro) terminar.
      setLoadingOrderId(null);
    }
  }
  // --- FIM DA CORREÇÃO ---

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Meus Pedidos</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.ordersList}>
          {orders.length === 0 ? (
            <div className={styles.emptyMessage}>
              <ShoppingBag size={40} />
              <p>Você ainda não fez nenhum pedido.</p>
            </div>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const firstItemName = order.items[0]?.product.name || 'Pedido'
              const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
              const isLoading = loadingOrderId === order.id; 

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <h4>{firstItemName} {order.items.length > 1 ? `+ ${order.items.length - 1} itens` : ''}</h4>
                    <span className={styles.orderPrice}>R${order.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className={styles.orderStatusWrapper}>
                    <span className={`${styles.statusDot} ${styles[order.status]}`}></span>
                    <span className={styles.statusText}>{statusInfo.text}</span>
                  </div>
                  <p className={styles.statusDescription}>{statusInfo.description}</p>
                  <div className={styles.orderFooter}>
                    <span>{totalItems} {totalItems > 1 ? 'itens' : 'item'}</span>
                    <span>{formatTime(order.createdAt)}</span>
                  </div>
                  
                  {order.status === 'completed' && (
                    <button 
                      className={styles.confirmButton}
                      onClick={() => handleConfirm(order.id)} 
                      disabled={isLoading} 
                    >
                      {isLoading ? 'Confirmando...' : 'Confirmar Entrega'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}