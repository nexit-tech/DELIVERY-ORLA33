'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { DisplayProduct, ComplementCategory, ComplementOption, SupabaseComboGroup, SupabaseComboGroupItem } from '@/types'
import { X } from 'lucide-react'
import styles from './styles.module.css'
import { useCart } from '@/context/CartContext'

interface ProductDetailsModalProps {
  product: DisplayProduct // Recebe o DisplayProduct
  onClose: () => void
}

export default function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false) 
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState("")
  
  // Estados de Dados
  const [complements, setComplements] = useState<ComplementCategory[]>([])
  const [isLoadingComplements, setIsLoadingComplements] = useState(false)
  const [selectedComplements, setSelectedComplements] = useState<{
    [categoryId: string]: ComplementOption[]
  }>({})
  
  const modalRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart() 

  // Efeito de animação
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // EFEITO PARA BUSCAR COMPLEMENTOS (O "ADAPTADOR")
  useEffect(() => {
    const fetchComplements = async () => {
      // Se não for um 'combo', não há complementos.
      if (product.type !== 'combo') {
        setIsLoadingComplements(false)
        return
      }

      setIsLoadingComplements(true)
      
      // Passo 1: Buscar os grupos do combo
      const { data: groups, error: groupsError } = await supabase
        .from('combo_groups')
        .select('*')
        .eq('combo_id', product.id) // Onde o combo_id é o do produto clicado

      if (groupsError) {
        console.error("Erro ao buscar grupos:", groupsError)
        setIsLoadingComplements(false)
        return
      }

      // Passo 2: Para cada grupo, buscar os itens e os detalhes dos produtos
      const categories: ComplementCategory[] = await Promise.all(
        groups.map(async (group: SupabaseComboGroup) => {
          
          // Passo 3: Buscar os itens E fazer "join" com a tabela products
          // A sintaxe é 'tabela_foreign_key(colunas...)'
          const { data: items, error: itemsError } = await supabase
            .from('combo_group_items')
            .select(`
              id,
              additional_price,
              products ( name, description ) 
            `) // Puxa nome/desc da tabela products
            .eq('group_id', group.id)

          if (itemsError) console.error("Erro ao buscar itens do grupo:", itemsError)

          // Passo 4: Adaptar os dados do Supabase para o nosso tipo ComplementOption
          const options: ComplementOption[] = (items || []).map((item: any) => ({
            id: item.id,
            name: item.products.name, // Nome do produto
            price: item.additional_price, // Preço adicional do combo
          }))

          // Passo 5: Adaptar para o nosso tipo ComplementCategory
          return {
            id: group.id,
            name: group.name,
            // TODO: Adicionar type ('single'/'multiple') e maxSelection no teu schema do Supabase
            type: 'single', // Hardcoded por enquanto
            maxSelection: 1, // Hardcoded por enquanto
            options: options,
          }
        })
      )

      setComplements(categories) // Salva os complementos formatados
      
      // 6. Pré-selecionar a primeira opção (lógica que já tínhamos)
      const initialComplements: { [categoryId: string]: ComplementOption[] } = {}
      categories.forEach(category => {
        if (category.type === 'single' && category.options.length > 0) {
          initialComplements[category.id] = [category.options[0]]
        } else {
          initialComplements[category.id] = []
        }
      })
      setSelectedComplements(initialComplements)
      
      setIsLoadingComplements(false)
    }

    fetchComplements()
  }, [product]) // Executa sempre que o produto mudar


  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  const handleComplementSelection = (
    categoryId: string,
    option: ComplementOption,
    type: 'single' | 'multiple',
    maxSelection: number
  ) => {
    setSelectedComplements((prev) => {
      const currentSelections = prev[categoryId] || []
      if (type === 'single') {
        return { ...prev, [categoryId]: [option] }
      } else {
        const isSelected = currentSelections.some((s) => s.id === option.id)
        let newSelections
        if (isSelected) {
          newSelections = currentSelections.filter((s) => s.id !== option.id)
        } else {
          if (currentSelections.length < maxSelection) {
            newSelections = [...currentSelections, option]
          } else {
            newSelections = currentSelections
          }
        }
        return { ...prev, [categoryId]: newSelections }
      }
    })
  }
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }
  
  // Lógica de cálculo (baseada no 'product.price' vindo do Supabase)
  const calculateTotalPrice = () => {
    let basePrice = product.price
    let complementsPrice = 0

    Object.values(selectedComplements).forEach((options) => {
      options.forEach((option) => {
        complementsPrice += option.price
      })
    })
    return (basePrice + complementsPrice) * quantity
  }
  const totalPrice = calculateTotalPrice()

  const handleAddToCart = () => {
    // A função addToCart precisa do 'Product' original.
    // O ideal era refatorar o CartContext, mas vamos "adaptar" por agora.
    const productDataForCart = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price, // O preço base (já é o base_price do combo)
      image: product.image_url || '',
      category: '', // O cart não usa isso
      complements: complements, // Passa os complementos que buscámos
    }

    // @ts-ignore
    addToCart(productDataForCart, quantity, selectedComplements, observation) 
    handleClose()
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
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar">
          <X size={24} />
        </button>
        
        <div className={styles.scrollableArea}>
          <div className={styles.productImageWrapper}>
            <img src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'} alt={product.name} className={styles.productImage} />
          </div>

          <div className={styles.productDetails}>
            <h2 className={styles.productName}>{product.name}</h2>
            {product.description && (
              <p className={styles.productDescription}>{product.description}</p>
            )}
            <span className={styles.productBasePrice}>${product.price.toFixed(2)}</span>
          </div>

          {/* Renderizar complementos reais */}
          {isLoadingComplements ? (
            <p style={{textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)'}}>A carregar opções...</p>
          ) : (
            complements.length > 0 && (
              <div className={styles.complementsSection}>
                {complements.map((category) => (
                  <div key={category.id} className={styles.complementCategory}>
                    <h3 className={styles.categoryTitle}>
                      {category.name}
                      {/* TODO: Usar o maxSelection do Supabase aqui */}
                      <span className={styles.categorySelectionInfo}>
                        (Escolha {category.maxSelection}) 
                      </span>
                    </h3>
                    <div className={styles.optionsList}>
                      {category.options.map((option) => {
                        const isSelected = selectedComplements[category.id]?.some(
                          (s) => s.id === option.id
                        )
                        return (
                          <button
                            key={option.id}
                            className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                            onClick={() =>
                              handleComplementSelection(
                                category.id,
                                option,
                                category.type,
                                category.maxSelection
                              )
                            }
                          >
                            <span className={styles.optionName}>{option.name}</span>
                            {option.price > 0 && (
                              <span className={styles.optionPrice}>+${option.price.toFixed(2)}</span>
                            )}
                            <span className={styles.checkboxIndicator}></span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          <div className={styles.observationWrapper}>
            <h3 className={styles.categoryTitle}>Observações</h3>
            <textarea
              className={styles.observationInput}
              placeholder="Ex: Tirar a cebola, ponto bem passado..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>
        
        <div className={styles.addToCartFooter}>
          <div className={styles.quantityControl}>
            <button onClick={() => handleQuantityChange(-1)} disabled={quantity === 1}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(1)}>+</button>
          </div>
          <button 
            className={styles.addToCartButton} 
            onClick={handleAddToCart}
          >
            Adicionar{' '}
            {quantity > 1 ? `${quantity} itens` : 'item'}
            {' - '}
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}