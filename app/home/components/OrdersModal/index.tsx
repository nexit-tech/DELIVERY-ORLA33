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
    case 'completed': // O Admin move para 'completed'
      return { text: 'Entregue', description: 'Seu pedido foi entregue.' } // O cliente vê isto
    case 'cancelled':
      return { text: 'Cancelado', description: 'O pedido foi cancelado.' }
    // Não precisamos do caso 'archived' aqui, porque ele nem vai aparecer na lista
    default:
      return { text: 'Status', description: '...' }
  }
}

export default function OrdersModal({ onClose }: OrdersModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  // 1. OBTER A FUNÇÃO CORRETA 'confirmDelivery'
  const { orders, confirmDelivery } = useOrders()
  // 2. ESTADO DE LOADING (para saber qual botão está a ser clicado)
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

  // 3. CRIAR O HANDLER PARA O BOTÃO
  const handleConfirm = async (orderId: string) => {
    setLoadingOrderId(orderId); // Ativa o loading
    try {
      await confirmDelivery(orderId);
      // O pedido vai sumir do estado local automaticamente
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar a entrega. Tente novamente.");
    } finally {
      setLoadingOrderId(null); // Desativa o loading
    }
  }

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
              const isLoading = loadingOrderId === order.id; // Verifica se ESTE botão está a carregar

              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <h4>{firstItemName} {order.items.length > 1 ? `+ ${order.items.length - 1} itens` : ''}</h4>
                    {/* 4. CORRIGIR PREÇO (usar R$ e o totalPrice do pedido) */}
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
                  
                  {/* 5. ATUALIZAR O BOTÃO CONDICIONAL */}
                  {order.status === 'completed' && (
                    <button 
                      className={styles.confirmButton}
                      onClick={() => handleConfirm(order.id)} // Chama o novo handler
                      disabled={isLoading} // Desativa se estiver a carregar
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