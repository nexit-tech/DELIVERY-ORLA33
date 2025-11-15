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
  updatePassword: (newPassword: string) => Promise<void>
  deleteAddress: (addressId: string) => Promise<void> // 1. PRECISA ESTAR NA INTERFACE
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ... (useEffect e fetchUserProfile permanecem os mesmos) ...
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

  // ... (login, logout, register, addAddress, updatePassword permanecem os mesmos) ...
  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });
      
      if (error) throw error;
      if (!data.session) throw new Error("Sessão não encontrada após o login.");
      await fetchUserProfile(data.session); 

    } catch (error) {
      console.error("Erro no login:", error);
      setIsLoading(false);
      throw error;
    }
  }

  const logout = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Erro ao fazer logout:", error)
    }
    setIsLoading(false)
  }

  const register = async (
    name: string, 
    email: string, 
    pass: string, 
    phone: string, 
    address: Omit<Address, 'id' | 'profile_id'>
  ) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: pass,
        options: {
          data: {
            name: name,
            phone: phone,
          }
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Criação do usuário falhou.");

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          phone: phone
        });
      if (profileError) throw profileError;

      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          ...address,
          profile_id: userId
        });
      if (addressError) throw addressError;

      if(authData.session) {
         await fetchUserProfile(authData.session);
      } else {
         setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Erro no registro:", error);
      setIsLoading(false);
      throw error;
    }
  }
  
  const addAddress = async (address: Omit<Address, 'id' | 'profile_id'>) => {
    if (!user) {
      console.error("Nenhum usuário logado para adicionar endereço.");
      throw new Error("Você precisa estar logado para adicionar um endereço.");
    }

    try {
      const newAddressData = {
        ...address,
        profile_id: user.id
      };
      
      const { data, error } = await supabase
        .from('addresses')
        .insert(newAddressData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao inserir endereço:", error);
        throw error;
      }
      if (!data) throw new Error("Não foi possível salvar o endereço.");

      setUser((currentUser) => {
        if (!currentUser) return null;
        const newAddress = data as Address;
        return {
          ...currentUser,
          addresses: [...currentUser.addresses, newAddress]
        };
      });

    } catch (error) {
      console.error("Erro ao adicionar endereço:", error);
      throw error;
    }
  }
  
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

  // --- 2. A FUNÇÃO PRECISA ESTAR IMPLEMENTADA ASSIM ---
  const deleteAddress = async (addressId: string) => {
    if (!user) {
      console.error("Nenhum usuário logado para deletar endereço.");
      throw new Error("Você precisa estar logado.");
    }

    try {
      // ETAPA A: APAGAR DO BANCO DE DADOS
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId) 
        .eq('profile_id', user.id); // Garante que só o dono pode apagar
      
      if (error) {
        console.error("Erro ao deletar endereço do Supabase:", error);
        throw error;
      }

      // ETAPA B: ATUALIZAR A TELA (ESTADO DO REACT)
      setUser((currentUser) => {
        if (!currentUser) return null;
        
        const updatedAddresses = currentUser.addresses.filter(
          (addr) => addr.id !== addressId
        );
        
        return {
          ...currentUser,
          addresses: updatedAddresses
        };
      });

    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
      throw error; 
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    register,
    addAddress,
    updatePassword,
    deleteAddress // 3. PRECISA ESTAR EXPORTADA AQUI
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