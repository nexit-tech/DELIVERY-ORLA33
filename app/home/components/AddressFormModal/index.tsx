'use client'

import { useState, useEffect } from 'react'
import { X, Home, Building, MapPin } from 'lucide-react'
import { Address } from '@/types'
import styles from './styles.module.css'

interface AddressFormModalProps {
  onClose: () => void
  onSaveAddress: (address: Omit<Address, 'id'>) => void
}

export default function AddressFormModal({ onClose, onSaveAddress }: AddressFormModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('') // "Casa", "Trabalho"
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [complement, setComplement] = useState('')

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

  const handleSave = () => {
    if (!name || !street || !number || !neighborhood) {
      alert('Por favor, preencha o nome, rua, número e bairro.')
      return
    }
    
    onSaveAddress({
      name,
      street,
      number,
      neighborhood,
      complement: complement || undefined
    })
    handleClose()
  }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Novo Endereço</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          <div className={styles.form}>
            <p className={styles.sectionTitle}>Identificação</p>
            <div className={styles.inputGroup}>
              <input type="text" placeholder="Nome do Endereço (ex: Casa)" className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <p className={styles.sectionTitle}>Endereço</p>
            <div className={styles.inputGroup}>
              <input type="text" placeholder="Rua / Avenida" className={styles.input} value={street} onChange={(e) => setStreet(e.target.value)} required />
            </div>
            
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="Nº" className={styles.input} value={number} onChange={(e) => setNumber(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <input type="text" placeholder="Bairro" className={styles.input} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <input type="text" placeholder="Complemento (Apto, Bloco, etc.)" className={styles.input} value={complement} onChange={(e) => setComplement(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.confirmButton} 
            onClick={handleSave}
          >
            Salvar Endereço
          </button>
        </div>
      </div>
    </div>
  )
}