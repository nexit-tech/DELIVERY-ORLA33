'use client'

// 1. Importar 'memo' do React (esta é a "blindagem")
import { useState, useEffect, memo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DisplayProduct, SupabaseProduct, SupabaseCombo, SupabaseCategory } from '@/types'
import CategoryTabs from '../CategoryTabs'
import ProductCard from '../ProductCard'
import ProductDetailsModal from '../ProductDetailsModal'
// Importar o 'styles' da página principal para usar 'productsGrid'
import styles from '../../styles.module.css'

const PROMO_CATEGORY_ID = 'virtual_promo_id'

// 2. Esta é a lógica que estava na sua page.tsx
function MenuContainer() {
  // --- Estados que saíram da page.tsx ---
  const [selectedProduct, setSelectedProduct] = useState<DisplayProduct | null>(null)
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false)
  
  const [allProducts, setAllProducts] = useState<DisplayProduct[]>([]) 
  const [filteredProducts, setFilteredProducts] = useState<DisplayProduct[]>([]) 
  const [categories, setCategories] = useState<SupabaseCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)

  // --- Funções que saíram da page.tsx ---
  const handleProductClick = (product: DisplayProduct) => { 
    setSelectedProduct(product)
    setIsProductDetailsOpen(true) 
  }
  const handleCloseProductDetails = () => { 
    setIsProductDetailsOpen(false)
    // Pequena melhoria: esperar a animação antes de limpar o produto
    setTimeout(() => setSelectedProduct(null), 300)
  }

  // --- useEffects que saíram da page.tsx ---
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

      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*')

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
  
  useEffect(() => {
    if (activeCategory === null) {
      setFilteredProducts(allProducts) 
    } else {
      setFilteredProducts(
        allProducts.filter(product => product.category_id === activeCategory)
      )
    }
  }, [activeCategory, allProducts])

  // 3. O JSX que saiu da page.tsx
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

      {/* O Modal do Produto agora vive AQUI,
      isolado das atualizações do OrderContext */}
      {isProductDetailsOpen && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={handleCloseProductDetails}
        />
      )}
    </>
  )
}

// 4. Exportar o componente "blindado" com React.memo
// Isto impede que ele re-renderize quando a page.tsx mudar
export default memo(MenuContainer)