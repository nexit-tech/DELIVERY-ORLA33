'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Landmark, CircleDollarSign, Smartphone } from 'lucide-react'
import { PaymentMethod } from '@/types'
import styles from './styles.module.css'

interface PaymentModalProps {
  onClose: () => void
  onConfirmOrder: (paymentMethod: PaymentMethod, changeFor?: number) => void
  totalPrice: number
}

export default function PaymentModal({ onClose, onConfirmOrder, totalPrice }: PaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('none')
  const [changeFor, setChangeFor] = useState('')

  useEffect(() => {
    // Animação de entrada
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300) // Espera a animação de saída
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleConfirm = () => {
    if (selectedPayment === 'none') {
      alert('Por favor, selecione uma forma de pagamento.')
      return
    }
    
    // Converte o "troco para" em número, se for o caso
    const changeAmount = selectedPayment === 'money' ? parseFloat(changeFor) : undefined
    if (selectedPayment === 'money' && changeAmount && changeAmount < totalPrice) {
        alert('O valor do troco deve ser maior ou igual ao total do pedido.')
        return
    }

    onConfirmOrder(selectedPayment, changeAmount)
  }

  const paymentOptions = [
    { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard size={20} /> },
    { id: 'debit', name: 'Cartão de Débito', icon: <CreditCard size={20} /> },
    { id: 'money', name: 'Dinheiro', icon: <CircleDollarSign size={20} /> },
    { id: 'pix', name: 'Pix', icon: <Smartphone size={20} /> },
  ]

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Pagamento</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          <div className={styles.paymentSection}>
            <h3 className={styles.sectionTitle}>Total</h3>
            <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
          </div>

          <div className={styles.paymentSection}>
            <h3 className={styles.sectionTitle}>Forma de Pagamento</h3>
            <div className={styles.optionsList}>
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  className={`${styles.optionItem} ${selectedPayment === option.id ? styles.selected : ''}`}
                  onClick={() => setSelectedPayment(option.id as PaymentMethod)}
                >
                  <div className={styles.optionIcon}>{option.icon}</div>
                  <span className={styles.optionName}>{option.name}</span>
                  <span className={styles.checkboxIndicator}></span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Troco condicional */}
          {selectedPayment === 'money' && (
            <div className={styles.paymentSection}>
              <h3 className={styles.sectionTitle}>Troco</h3>
              <p className={styles.sectionDescription}>
                Precisa de troco para quanto? (Deixe em branco se não precisar)
              </p>
              <div className={styles.inputGroup}>
                <span>R$</span>
                <input
                  type="number"
                  placeholder="50,00"
                  className={styles.changeInput}
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.confirmButton} 
            onClick={handleConfirm}
            disabled={selectedPayment === 'none'}
          >
            Confirmar Pedido
          </button>
        </div>
      </div>
    </div>
  )
}