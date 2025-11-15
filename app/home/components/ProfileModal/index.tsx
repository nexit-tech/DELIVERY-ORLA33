'use client'

import { useState, useEffect, useRef } from 'react'
// 1. REMOVER 'Package' (ícone do botão)
import { X, User, MapPin, LogOut, Edit3, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import styles from './styles.module.css'

// 2. REMOVER 'onViewOrders' DA INTERFACE
interface ProfileModalProps {
  onClose: () => void
  onAddAddressClick: () => void
  onEditClick: () => void
  onDeleteAddressClick: (addressId: string) => void
}

export default function ProfileModal({ 
  onClose, 
  onAddAddressClick,
  onEditClick,
  onDeleteAddressClick 
}: ProfileModalProps) { // 3. REMOVER 'onViewOrders' DAQUI
  
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth() 
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // 4. REMOVER A FUNÇÃO 'handleViewOrders'
  /*
  const handleViewOrders = () => {
    handleClose()
    onViewOrders()
  }
  */

  const handleLogout = () => {
    logout()
    handleClose()
  }
  
  const handleAddAddress = () => {
    onAddAddressClick() 
  }

  const handleDeleteAddress = (addressId: string) => {
    onDeleteAddressClick(addressId); 
  };

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
        ref={modalRef}
      >
        <div className={styles.header}>
          <h2>Meu Perfil</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          {/* ... (profileHeader e section de endereços ficam iguais) ... */}
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
                  <div className={styles.addressInfo}>
                    <h5>{address.name}</h5>
                    <p>{address.street}, {address.number}</p>
                    <p>{address.neighborhood}</p>
                    {address.complement && (
                      <p className={styles.addressComplement}>{address.complement}</p>
                    )}
                  </div>
                  
                  <button 
                    className={styles.deleteAddressButton}
                    onClick={() => handleDeleteAddress(address.id)}
                    aria-label="Apagar endereço"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button className={styles.addButton} onClick={handleAddAddress}>
              + Adicionar novo endereço
            </button>
          </div>

          <div className={styles.section}>
            {/* 5. REMOVER O BOTÃO DE HISTÓRICO DAQUI */}
            {/*
            <button className={styles.linkButton} onClick={handleViewOrders}>
              <Package size={20} />
              <span>Ver histórico de pedidos</span>
            </button>
            */}
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