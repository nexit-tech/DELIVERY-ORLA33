'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import styles from './styles.module.css'

interface ConfirmDeleteModalProps {
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({ onClose, onConfirm }: ConfirmDeleteModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  const handleConfirm = () => {
    // Não fechamos o modal aqui, deixamos a 'page.tsx'
    // fechar após a exclusão ser bem-sucedida.
    onConfirm()
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Confirmar Exclusão</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          <div className={styles.contentBody}>
            <div className={styles.iconWrapper}>
              <AlertTriangle size={40} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>Apagar Endereço?</h3>
            <p className={styles.description}>
              Esta ação não pode ser desfeita. O endereço será
              removido permanentemente da sua conta.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={handleClose}>
              Cancelar
            </button>
            <button className={styles.confirmButton} onClick={handleConfirm}>
              Sim, Apagar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}