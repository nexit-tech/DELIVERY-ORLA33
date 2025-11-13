'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import styles from './styles.module.css'

interface ChangePasswordModalProps {
  onClose: () => void
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const { updatePassword } = useAuth()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('As senhas não são iguais.')
      return
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setError(null)
    setMessage(null)
    setIsLoading(true)
    
    try {
      await updatePassword(newPassword)
      setMessage('Senha atualizada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      // Fecha o modal automaticamente após 2 segundos
      setTimeout(handleClose, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar a senha.')
    } finally {
      setIsLoading(false)
    }
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
          <h2>Trocar Senha</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.scrollableArea}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <p className={styles.description}>
              Insira sua nova senha. Você será deslogado de outros dispositivos.
            </p>
            
            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="Nova Senha (mín. 6 caracteres)"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                placeholder="Confirmar Nova Senha"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}
            
            <button type="submit" className={styles.confirmButton} disabled={isLoading}>
              {isLoading ? 'A atualizar...' : 'Atualizar Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}