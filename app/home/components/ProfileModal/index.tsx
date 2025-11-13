'use client'

import { useState, useEffect, useRef } from 'react' // 1. IMPORTAR useRef
import { X, User, MapPin, Package, LogOut, Edit3 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import styles from './styles.module.css'

interface ProfileModalProps {
  onClose: () => void
  onViewOrders: () => void
  onAddAddressClick: () => void
  onEditClick: () => void
}

export default function ProfileModal({ 
  onClose, 
  onViewOrders, 
  onAddAddressClick,
  onEditClick
}: ProfileModalProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth() 
  const modalRef = useRef<HTMLDivElement>(null) // 2. ADICIONAR REF

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  // 3. CORRIGIR CLIQUE NO OVERLAY
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleViewOrders = () => {
    handleClose()
    onViewOrders()
  }

  const handleLogout = () => {
    logout()
    handleClose()
  }
  
  const handleAddAddress = () => {
    onAddAddressClick() 
  }

  if (!user) {
    return null 
  }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div 
        className={`${styles.modalContent} ${isOpen ? styles.open : ''}`} 
        ref={modalRef} // 4. LIGAR REF
      >
        <div className={styles.header}>
          <h2>Meu Perfil</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          {/* ... (O resto do JSX permanece o mesmo) ... */}
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              <User size={30} />
            </div>
            <div className={styles.userInfo}>
              <h3 className={styles.userName}>{user.name}</h3>
              <p className={styles.userEmail}>{user.email}</p>
              <p className={styles.userEmail}>{user.phone}</p>
            </div>
            <button className={styles.editButton} onClick={onEditClick}>
              <Edit3 size={16} />
            </button>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <MapPin size={16} /> Meus Endereços
            </h4>
            <div className={styles.addressList}>
              {user.addresses.map((address) => (
                <div key={address.id} className={styles.addressCard}>
                  <h5>{address.name}</h5>
                  <p>{address.street}, {address.number}</p>
                  <p>{address.neighborhood}</p>
                </div>
              ))}
            </div>
            <button className={styles.addButton} onClick={handleAddAddress}>
              + Adicionar novo endereço
            </button>
          </div>

          <div className={styles.section}>
            <button className={styles.linkButton} onClick={handleViewOrders}>
              <Package size={20} />
              <span>Ver histórico de pedidos</span>
            </button>
            <button className={styles.linkButton} onClick={handleLogout}>
              <LogOut size={20} />
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}