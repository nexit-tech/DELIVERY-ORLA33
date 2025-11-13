'use client'
// 1. REMOVIDO useState, useEffect, supabase
import styles from './styles.module.css'
import { SupabaseCategory } from '@/types' // 2. Manter o tipo

// 3. DEFINIR NOVAS PROPS
interface CategoryTabsProps {
  categories: SupabaseCategory[]
  activeCategory: string | null
  onCategorySelect: (categoryId: string) => void
}

export default function CategoryTabs({ 
  categories, 
  activeCategory, 
  onCategorySelect 
}: CategoryTabsProps) {
  
  // 4. TODA A LÓGICA DE useEffect e useState FOI REMOVIDA DAQUI

  return (
    <div className={styles.container}>
      <div className={styles.tabsScroll}>
        {/* 5. Mapear as categorias recebidas via props */}
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.tab} ${activeCategory === category.id ? styles.active : ''}`}
            onClick={() => onCategorySelect(category.id)} // 6. Usar a função recebida via prop
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}