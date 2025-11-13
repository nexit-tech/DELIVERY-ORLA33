'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { AppUser, Address } from '@/types'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: AppUser | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  register: (
    name: string, 
    email: string, 
    pass: string,
    phone: string, 
    address: Omit<Address, 'id' | 'profile_id'>
  ) => Promise<void>
  addAddress: (address: Omit<Address, 'id' | 'profile_id'>) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void> // <-- 1. ADICIONADO
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ... (useEffect, fetchUserProfile, login, logout, register, addAddress permanecem iguais) ...
  useEffect(() => {
    setIsLoading(true)
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchUserProfile(session)
      } else {
        setIsLoading(false)
      }
    }
    getInitialSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchUserProfile(session)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (session: Session) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profileError) throw profileError
      
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', session.user.id)
      if (addressError) throw addressError

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: profile.name,
        phone: profile.phone,
        addresses: addresses || []
      })
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, pass: string) => { /* ... */ }
  const logout = async () => { /* ... */ }
  const register = async (
    name: string, 
    email: string, 
    pass: string, 
    phone: string, 
    address: Omit<Address, 'id' | 'profile_id'>
  ) => { /* ... */ }
  const addAddress = async (address: Omit<Address, 'id' | 'profile_id'>) => { /* ... */ }
  
  // 2. NOVA FUNÇÃO PARA TROCAR SENHA
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error("Erro ao atualizar senha:", error)
      throw error
    }
    console.log("Senha atualizada com sucesso:", data)
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
    addAddress,
    updatePassword // <-- 3. EXPOR A FUNÇÃO
  }

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

// Hook customizado
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}