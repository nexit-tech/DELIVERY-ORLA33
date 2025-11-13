'use client'

import { useState, useEffect, useRef } from "react" // 1. IMPORTAR o 'useRef'
import { X, LogIn, User, Mail, Lock, Phone, MapPin } from 'lucide-react'
import styles from './styles.module.css'
import { useAuth } from "@/context/AuthContext"

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Estados do Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estados do Registo
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regStreet, setRegStreet] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [regNeighborhood, setRegNeighborhood] = useState('')

  const { login, register } = useAuth()

  // 2. DEFINIR O 'modalRef' QUE FALTAVA
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      onClose()
      setMode('login')
      setError(null)
    }, 300)
  }

  // 3. ATUALIZAR a lógica de clique no overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // --- Funções de Login ---
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      handleClose()
    } catch (err: any) {
      setError(err.message || "Erro no login.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- Função de Registo ---
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regPassword !== regConfirmPassword) {
      setError("As senhas não são iguais.")
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      await register(
        regName,
        regEmail,
        regPassword,
        regPhone,
        { 
          name: 'Principal',
          street: regStreet, 
          number: regNumber, 
          neighborhood: regNeighborhood,
          complement: null // Adicionado para bater com o tipo
        }
      )
      handleClose()
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => { alert('Login com Google (a implementar...)') }
  const handleContinueAsGuest = () => { handleClose() }

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div 
        className={`${styles.modalContent} ${isOpen ? styles.open : ''}`} 
        ref={modalRef} // 4. O 'ref' agora funciona
      >
        <div className={styles.header}>
          <h2>{mode === 'login' ? 'Login' : 'Criar Conta'}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* ... (O resto do JSX permanece o mesmo) ... */}
        {mode === 'login' ? (
          // --- TELA DE LOGIN ---
          <div className={styles.contentBody}>
            <div className={styles.iconWrapper}>
              <User size={50} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>Acesse sua conta</h3>

            <form className={styles.form} onSubmit={handleSubmitLogin}>
              <div className={styles.inputGroup}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  placeholder="Sua senha" 
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? "A entrar..." : <><LogIn size={20} /> Entrar</>}
              </button>
            </form>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.divider}><span>ou</span></div>
            <button className={styles.googleButton} onClick={handleGoogleLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"></path><path d="M12 22v-4"></path><path d="M12 2v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
              Entrar com Google
            </button>
            <button className={styles.toggleModeButton} onClick={() => { setMode('register'); setError(null); }}>
              Não tem conta? <strong>Crie uma agora</strong>
            </button>
            <button className={styles.guestButton} onClick={handleContinueAsGuest}>
              Continuar como visitante
            </button>
          </div>
        ) : (
          // --- TELA DE REGISTO ---
          <div className={styles.contentBody}>
            <h3 className={styles.title}>Crie sua conta</h3>
            
            <form className={styles.form} onSubmit={handleSubmitRegister}>
              <div className={styles.inputGroup}>
                <User size={18} className={styles.inputIcon} />
                <input type="text" placeholder="Nome completo" className={styles.input} value={regName} onChange={(e) => setRegName(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <Mail size={18} className={styles.inputIcon} />
                <input type="email" placeholder="Seu e-mail" className={styles.input} value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <Phone size={18} className={styles.inputIcon} />
                <input type="tel" placeholder="Telefone (WhatsApp)" className={styles.input} value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
              </div>

              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.inputIcon} />
                <input type="password" placeholder="Crie uma senha" className={styles.input} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.inputIcon} />
                <input type="password" placeholder="Confirme a senha" className={styles.input} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
              </div>
              
              <p className={styles.addressTitle}>Endereço Principal</p>
              
              <div className={styles.inputGroup}>
                <MapPin size={18} className={styles.inputIcon} />
                <input type="text" placeholder="Rua / Avenida" className={styles.input} value={regStreet} onChange={(e) => setRegStreet(e.target.value)} required />
              </div>
              
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <input type="text" placeholder="Nº" className={styles.input} value={regNumber} onChange={(e) => setRegNumber(e.target.value)} required />
                </div>
                <div className={styles.inputGroup}>
                  <input type="text" placeholder="Bairro" className={styles.input} value={regNeighborhood} onChange={(e) => setRegNeighborhood(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? "A criar..." : "Criar conta e Entrar"}
              </button>
            </form>
            {error && <p className={styles.error}>{error}</p>}
            <button className={styles.toggleModeButton} onClick={() => { setMode('login'); setError(null); }}>
              Já tem conta? <strong>Faça login</strong>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}