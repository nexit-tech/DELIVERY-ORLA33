'use client'

import { useState, useEffect, memo } from 'react'
import { supabase } from '@/lib/supabaseClient'
// --- IMPORTAÇÕES ADICIONADAS PARA O FETCH ---
import { DisplayProduct, SupabaseProduct, SupabaseCombo, SupabaseCategory, ComplementCategory, SupabaseComboGroup, ComplementOption } from '@/types'
// --- FIM DA ADIÇÃO ---
import CategoryTabs from '../CategoryTabs'
import ProductCard from '../ProductCard'
import ProductDetailsModal from '../ProductDetailsModal'
import styles from '../../styles.module.css'

const PROMO_CATEGORY_ID = 'virtual_promo_id'

// 1. O componente é mantido para usar o memo e evitar re-renders
function MenuContainer() {
  // --- ESTADOS DO MODAL E DO MENU (Mantidos) ---
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  
  const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]) 
  const [filteredProducts, setFilteredProducts] = useState<DisplayProduct[]>([]) 
  const [categories, setCategories] = useState<SupabaseCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)

  // --- (CORREÇÃO 1) ESTADOS NECESSÁRIOS PARA O MODAL ---
  const [complements, setComplements] = useState<ComplementCategory[]>([])
  const [isLoadingComplements, setIsLoadingComplements] = useState(false)
  // --- FIM DA CORREÇÃO 1 ---

  // --- (CORREÇÃO 2) FUNÇÃO PARA BUSCAR COMPLEMENTOS (Movida de volta) ---
  const fetchComplements = async (product: DisplayProduct) => {
    if (product.type !== 'combo') {
      setComplements([])
      setIsLoadingComplements(false)
      return
    }

    setIsLoadingComplements(true)
    
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('combo_groups')
        .select('*')
        .eq('combo_id', product.id)

      if (groupsError) throw groupsError

      const categories: ComplementCategory[] = await Promise.all(
        groups.map(async (group: SupabaseComboGroup) => {
          const { data: items, error: itemsError } = await supabase
            .from('combo_group_items')
            .select(`id, additional_price, products ( name, description )`)
            .eq('group_id', group.id)

          if (itemsError) console.error("Erro ao buscar itens:", itemsError)

          const options: ComplementOption[] = (items || []).map((item: any) => ({
            id: item.id,
            name: item.products.name,
            price: item.additional_price,
          }))

          return {
            id: group.id,
            name: group.name,
            type: 'single', // Hardcoded
            maxSelection: 1, // Hardcoded
            options: options,
          }
        })
      )
      setComplements(categories)
    } catch (err) {
      console.error("Erro ao buscar complementos:", err)
      setComplements([]) // Limpa em caso de erro
    } finally {
      setIsLoadingComplements(false)
    }
  }

  // --- FUNÇÕES DE CONTROLE DE MODAL ---
  const handleProductClick = (product: DisplayProduct) => { 
    setSelectedProduct(product)
    setIsProductDetailsOpen(true)
    fetchComplements(product) // <-- CHAMA O FETCH
  }
  
  const handleCloseProductDetails = () => { 
    setIsProductDetailsOpen(false)
    // Limpa os dados do modal para a próxima abertura
    setTimeout(() => {
      setSelectedProduct(null)
      setComplements([]) // <-- LIMPA OS COMPLEMENTOS
    }, 300) 
  }

  // --- EFEITOS DE BUSCAR E FILTRAR MENU (Mantidos) ---
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoadingMenu(true)
      
      const promoCategory: SupabaseCategory = {
        id: PROMO_CATEGORY_ID,
        name: 'Promoções',
        created_at: new Date().toISOString()
      }
      // ... (Restante da lógica de busca do menu) ...
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

      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')

      const { data: combos, error: comboError } = await supabase
        .from('combos')
        .select('*') 

      if (productError) console.error("Erro ao buscar produtos:", productError)
      if (comboError) console.error("Erro ao buscar combos:", comboError)

      const formattedProducts: DisplayProduct[] = (products || []).map((p: SupabaseProduct) => ({
        id: p.id, name: p.name, description: p.description, price: p.price, image_url: p.image_url, type: 'product', category_id: p.category_id,
      }))
      
      const formattedCombos: DisplayProduct[] = (combos || []).map((c: SupabaseCombo) => ({
        id: c.id, name: c.name, description: c.description || null, price: c.base_price, image_url: c.image_url || null, type: 'combo', category_id: PROMO_CATEGORY_ID,
      }))

      setAllProducts([...formattedProducts, ...formattedCombos])
      setIsLoadingMenu(false)
    }

    fetchMenu()
  }, [])
  
  useEffect(() => {
    if (activeCategory === null) {
      setFilteredProducts(allProducts) 
    } else {
      setFilteredProducts(
        allProducts.filter(product => product.category_id === activeCategory)
      )
    }
  }, [activeCategory, allProducts])

  // 3. O JSX e o Modal com as props adicionadas
  return (
    <>
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

      {/* MODAL COM PROPS CORRETAS */}
      {isProductDetailsOpen && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={handleCloseProductDetails}
          complements={complements}             // <-- PROP NECESSÁRIA
          isLoadingComplements={isLoadingComplements} // <-- PROP NECESSÁRIA
        />
      )}
    </>
  )
}

// 4. Exportar o componente "blindado" com React.memo
// Isto impede que ele re-renderize quando a page.tsx mudar
export default memo(MenuContainer)