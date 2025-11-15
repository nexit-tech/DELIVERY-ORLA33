'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Home, Building, User, Phone } from 'lucide-react'
import { Address } from '@/types' // <-- O TIPO JÁ ESTÁ AQUI
import { useAuth } from '@/context/AuthContext'
import styles from './styles.module.css'

interface AddressModalProps {
  onClose: () => void
  onConfirmAddress: (address: Address) => void
  onAddAddressClick: () => void // Para abrir o AddressFormModal
}

export default function AddressModal({ onClose, onConfirmAddress, onAddAddressClick }: AddressModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  // --- Estados para o formulário de VISITANTE ---
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestStreet, setGuestStreet] = useState('')
  const [guestNumber, setGuestNumber] = useState('')
  const [guestNeighborhood, setGuestNeighborhood] = useState('')

  const savedAddresses = user ? user.addresses : []

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (user && savedAddresses.length > 0) {
      setSelectedAddress(savedAddresses[0])
    }
  }, [user, savedAddresses])


  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleConfirm = () => {
    if (user) {
      // --- Lógica para UTILIZADOR LOGADO ---
      if (!selectedAddress) {
        alert('Por favor, selecione um endereço.')
        return
      }
      onConfirmAddress(selectedAddress)
    } else {
      // --- Lógica para VISITANTE ---
      if (!guestName || !guestPhone || !guestStreet || !guestNumber || !guestNeighborhood) {
        alert('Por favor, preencha todos os seus dados e o endereço de entrega.')
        return
      }
      
      // Cria um objeto de Endereço "temporário"
      const guestAddress: Address = {
        id: 'guest_addr',
        name: guestName, // Usa o nome do visitante como "nome" do endereço
        street: guestStreet,
        number: guestNumber,
        neighborhood: guestNeighborhood,
      }
      onConfirmAddress(guestAddress)
    }
  }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Endereço de Entrega</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          {user ? (
            // --- Conteúdo para UTILIZADOR LOGADO ---
            <>
              <div className={styles.addressList}>
                <h3 className={styles.sectionTitle}>Endereços Salvos</h3>
                {/* --- A CORREÇÃO ESTÁ AQUI ---
                  Adicionamos o tipo (address: Address)
                */}
                {savedAddresses.map((address: Address) => (
                  <button
                    key={address.id}
                    className={`${styles.optionItem} ${selectedAddress?.id === address.id ? styles.selected : ''}`}
                    onClick={() => setSelectedAddress(address)}
                  >
                    <div className={styles.optionIcon}>
                      {address.name.toLowerCase() === 'casa' ? <Home size={20} /> : <Building size={20} />}
                    </div>
                    <div className={styles.optionDetails}>
                      <span className={styles.optionName}>{address.name}</span>
                      <span className={styles.optionDescription}>
                        {address.street}, {address.number}
                      </span>
                    </div>
                    <span className={styles.checkboxIndicator}></span>
                  </button>
                ))}
              </div>
              <button className={styles.addButton} onClick={onAddAddressClick}>
                + Adicionar novo endereço
              </button>
            </>
          ) : (
            // --- Conteúdo para VISITANTE ---
            <div className={styles.guestForm}>
              <h3 className={styles.sectionTitle}>Seus Dados</h3>
              <div className={styles.inputGroup}>
                <User size={18} className={styles.inputIcon} />
                <input type="text" placeholder="Nome Completo" className={styles.input} value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <Phone size={18} className={styles.inputIcon} />
                <input type="tel" placeholder="Telefone (WhatsApp)" className={styles.input} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
              </div>

              <h3 className={styles.sectionTitle} style={{marginTop: '1.5rem'}}>Endereço de Entrega</h3>
              <div className={styles.inputGroup}>
                <MapPin size={18} className={styles.inputIcon} />
                <input type="text" placeholder="Rua / Avenida" className={styles.input} value={guestStreet} onChange={(e) => setGuestStreet(e.target.value)} required />
              </div>
              
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <input type="text" placeholder="Nº" className={styles.input} value={guestNumber} onChange={(e) => setGuestNumber(e.target.value)} required />
                </div>
                <div className={styles.inputGroup}>
                  <input type="text" placeholder="Bairro" className={styles.input} value={guestNeighborhood} onChange={(e) => setGuestNeighborhood(e.target.value)} required />
                </div>
              </div>
            </div>
          )}
          
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.confirmButton} 
            onClick={handleConfirm}
          >
            Ir para Pagamento
          </button>
        </div>
      </div>
    </div>
  )
}