'use client' 

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { useOrders } from '@/context/OrderContext'
import { useAuth } from '@/context/AuthContext'
import HeroSection from './components/HeroSection'
import CategoryTabs from './components/CategoryTabs'
import ProductCard from './components/ProductCard'
import Navbar from './components/Navbar'
import ProductDetailsModal from './components/ProductDetailsModal'
import CartModal from './components/CartModal'
import OrdersModal from './components/OrdersModal'
import LoginModal from './components/LoginModal'
import PaymentModal from './components/PaymentModal'
import AddressModal from './components/AddressModal'
import ProfileModal from './components/ProfileModal'
import AddressFormModal from './components/AddressFormModal'
import ChangePasswordModal from './components/ChangePasswordModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import { supabase } from '@/lib/supabaseClient'
// Import agora está correto (AppUser existe)
import { DisplayProduct, SupabaseProduct, SupabaseCombo, PaymentMethod, Address, SupabaseCategory, AppUser, Order } from '@/types'
import styles from './styles.module.css'

const PROMO_CATEGORY_ID = 'virtual_promo_id'

export default function HomePage() {
  const { cartItems, clearCart } = useCart()
  const { addOrder } = useOrders()
  const { user, logout, addAddress, deleteAddress, isLoading: isAuthLoading } = useAuth() 

  // --- Estados dos Modals ---
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // --- Estado dos Dados (com filtro) ---
  const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]) 
  const [filteredProducts, setFilteredProducts] = useState<DisplayProduct[]>([]) 
  const [categories, setCategories] = useState<SupabaseCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)

  const [selectedAddressForOrder, setSelectedAddressForOrder] = useState<Address | null>(null)

  // EFEITO PARA BUSCAR OS DADOS (Produtos, Combos E Categorias)
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoadingMenu(true)
      
      const promoCategory: SupabaseCategory = {
        id: PROMO_CATEGORY_ID,
        name: 'Promoções',
        created_at: new Date().toISOString()
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (categoryError) {
        console.error("Erro ao buscar categorias:", categoryError)
      } else if (categoryData) {
        setCategories([promoCategory, ...categoryData])
        setActiveCategory(promoCategory.id)
      }

      // Puxar Produtos
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')

      // Puxar Combos
      const { data: combos, error: comboError } = await supabase
        .from('combos')
        .select('*') 

      if (productError) console.error("Erro ao buscar produtos:", productError)
      if (comboError) console.error("Erro ao buscar combos:", comboError)

      const formattedProducts: DisplayProduct[] = (products || []).map((p: SupabaseProduct) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        type: 'product',
        category_id: p.category_id,
      }))
      
      // --- CORREÇÃO AQUI (Linha 124) ---
      // (c: any) virou (c: SupabaseCombo)
      const formattedCombos: DisplayProduct[] = (combos || []).map((c: SupabaseCombo) => ({
        id: c.id,
        name: c.name,
        description: c.description || null,
        price: c.base_price,
        image_url: c.image_url || null,
        type: 'combo',
        category_id: PROMO_CATEGORY_ID,
      }))

      setAllProducts([...formattedProducts, ...formattedCombos])
      setIsLoadingMenu(false)
    }

    fetchMenu()
  }, [])
  
  // EFEITO PARA FILTRAR A LISTA
  useEffect(() => {
    if (activeCategory === null) {
      setFilteredProducts(allProducts) 
    } else {
      setFilteredProducts(
        allProducts.filter(product => product.category_id === activeCategory)
      )
    }
  }, [activeCategory, allProducts])


  // Efeito para gerir o scroll global
  useEffect(() => {
    if (isProductDetailsOpen || isCartOpen || isOrdersOpen || isLoginOpen || 
        isPaymentOpen || isAddressModalOpen || isProfileModalOpen || 
        isAddressFormOpen || isChangePasswordOpen || isConfirmDeleteOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [isProductDetailsOpen, isCartOpen, isOrdersOpen, isLoginOpen, 
      isPaymentOpen, isAddressModalOpen, isProfileModalOpen, 
      isAddressFormOpen, isChangePasswordOpen, isConfirmDeleteOpen])

  // --- Funções de Abertura/Fecho de Modals ---
  const handleProductClick = (product: DisplayProduct) => { setSelectedProduct(product); setIsProductDetailsOpen(true) }
  const handleCloseProductDetails = () => { setIsProductDetailsOpen(false); setSelectedProduct(null) }
  const handleOpenCart = () => setIsCartOpen(true)
  const handleCloseCart = () => setIsCartOpen(false)
  const handleOpenOrders = () => setIsOrdersOpen(true)
  const handleCloseOrders = () => setIsOrdersOpen(false)
  const handleOpenPayment = () => setIsPaymentOpen(true)
  const handleClosePayment = () => setIsPaymentOpen(false)
  const handleOpenAddress = () => setIsAddressModalOpen(true)
  const handleCloseAddress = () => setIsAddressModalOpen(false)
  
  const handleOpenLogin = () => setIsLoginOpen(true)
  const handleCloseLogin = () => setIsLoginOpen(false)
  const handleOpenProfile = () => setIsProfileModalOpen(true)
  const handleCloseProfile = () => setIsProfileModalOpen(false)
  
  const handleOpenAddressForm = () => setIsAddressFormOpen(true)
  const handleCloseAddressForm = () => setIsAddressFormOpen(false)
  
  const handleOpenChangePassword = () => setIsChangePasswordOpen(true)
  const handleCloseChangePassword = () => setIsChangePasswordOpen(false)
  
  const handleOpenConfirmDelete = (addressId: string) => {
    setAddressToDelete(addressId)
    setIsConfirmDeleteOpen(true)
  }
  const handleCloseConfirmDelete = () => {
    setAddressToDelete(null)
    setIsConfirmDeleteOpen(false)
  }
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await deleteAddress(addressToDelete);
      handleCloseConfirmDelete();
    } catch (err: any) {
      alert(`Erro ao apagar: ${err.message}`);
    }
  }

  const handleSaveAddress = (address: Omit<Address, 'id' | 'profile_id'>) => {
    addAddress(address)
    handleCloseAddressForm()
  }

  // --- LÓGICA DO BOTÃO "PERFIL" ---
  const handleProfileClick = () => {
    if (user) {
      handleOpenProfile()
    } else {
      handleOpenLogin()
    }
  }

  // --- FLUXO DE CHECKOUT ---
  const handleCheckout = () => {
    handleCloseCart()
    handleOpenAddress()
  }

  const handleAddressConfirm = (address: Address) => {
    setSelectedAddressForOrder(address)
    handleCloseAddress()
    handleOpenPayment()
  }

  const handleConfirmOrder = async (paymentMethod: PaymentMethod, changeFor?: number): Promise<Order> => {
    if (!selectedAddressForOrder) {
      alert("Erro: Nenhum endereço selecionado.");
      throw new Error("Endereço não selecionado"); // Lança erro
    }
    
    setIsPlacingOrder(true);
    
    try {
      const subtotal = cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
      
      // @ts-ignore
      const newOrder = await addOrder(cartItems, subtotal, paymentMethod, selectedAddressForOrder, user, changeFor);
      
      if (paymentMethod !== 'pix') {
        clearCart();
        handleClosePayment();
        handleOpenOrders();
        setSelectedAddressForOrder(null);
      }
      
      return newOrder; 

    } catch (error: any) {
      console.error("Erro ao confirmar pedido:", error);
      alert(`Falha ao criar o pedido: ${error.message}`);
      throw error; // Lança o erro
    } finally {
      setIsPlacingOrder(false);
    }
  }
  
  // LÓGICA DO MODAL DE PERFIL
  const handleEditProfile = () => {
    handleCloseProfile()
    handleOpenChangePassword()
  }
  
  if (isAuthLoading) {
    return <div style={{textAlign: 'center', color: 'var(--text-secondary)', paddingTop: '50vh'}}>A carregar sessão...</div>
  }

  return (
    <>
      <main className={styles.container}>
        <HeroSection />
        
        <CategoryTabs 
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={setActiveCategory}
        />
        
        <div className={styles.productsGrid}>
          {isLoadingMenu ? (
            <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>A carregar o menu...</p>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard 
                key={`${product.type}-${product.id}`}
                product={product} 
                onProductClick={handleProductClick}
              />
            ))
          )}
        </div>
      </main> 

      {/* Navbar e Modals (irmãos do <main>) */}
      <Navbar 
        onCartClick={handleOpenCart} 
        onOrdersClick={handleOpenOrders}
        onProfileClick={handleProfileClick}
      />

      {/* --- RENDERIZAÇÃO DE TODOS OS MODALS --- */}

      {isProductDetailsOpen && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={handleCloseProductDetails}
        />
      )}

      {isCartOpen && (
        <CartModal 
          onClose={handleCloseCart} 
          onCheckoutSuccess={handleCheckout}
        />
      )}
      
      {isAddressModalOpen && (
        <AddressModal
          onClose={handleCloseAddress}
          onConfirmAddress={handleAddressConfirm}
          onAddAddressClick={handleOpenAddressForm}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal 
          onClose={handleClosePayment}
          onConfirmOrder={handleConfirmOrder}
          totalPrice={cartItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0)}
          isLoading={isPlacingOrder}
        />
      )}

      {isOrdersOpen && (
        <OrdersModal onClose={handleCloseOrders} />
      )}

      {isLoginOpen && (
        <LoginModal onClose={handleCloseLogin} />
      )}
      
      {isProfileModalOpen && user && (
        <ProfileModal 
          onClose={handleCloseProfile}
          onAddAddressClick={handleOpenAddressForm}
          onEditClick={handleEditProfile}
          onDeleteAddressClick={handleOpenConfirmDelete}
        />
      )}
      
      {isAddressFormOpen && (
        <AddressFormModal 
          onClose={handleCloseAddressForm}
          // @ts-ignore
          onSaveAddress={handleSaveAddress}
        />
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal onClose={handleCloseChangePassword} />
      )}
      
      {isConfirmDeleteOpen && (
        <ConfirmDeleteModal
          onClose={handleCloseConfirmDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}