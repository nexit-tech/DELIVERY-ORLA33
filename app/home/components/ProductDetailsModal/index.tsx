'use client'

import { useState, useEffect, useRef } from 'react'
// import { supabase } from '@/lib/supabaseClient' <-- REMOVIDO
import { DisplayProduct, ComplementCategory, ComplementOption } from '@/types'
import { X } from 'lucide-react'
import styles from './styles.module.css'
import { useCart } from '@/context/CartContext'

interface ProductDetailsModalProps {
  product: DisplayProduct
  onClose: () => void
  complements: ComplementCategory[] // <-- NOVA PROP
  isLoadingComplements: boolean // <-- NOVA PROP
}

export default function ProductDetailsModal({ 
  product, 
  onClose, 
  complements, 
  isLoadingComplements 
}: ProductDetailsModalProps) {
  
  const [isOpen, setIsOpen] = useState(false) 
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState("")
  
  // --- ESTADOS E USEEFFECT REMOVIDOS ---
  // const [complements, setComplements] = useState<ComplementCategory[]>([])
  // const [isLoadingComplements, setIsLoadingComplements] = useState(false)
  // O useEffect que buscava dados foi todo REMOVIDO
  
  const [selectedComplements, setSelectedComplements] = useState<{
    [categoryId: string]: ComplementOption[]
  }>({})
  
  const modalRef = useRef<HTMLDivElement>(null)
  const { addToCart } = useCart() 

  const scrollRef = useRef<HTMLDivElement>(null) 
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState<number | null>(null)

  // Efeito de animação
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // --- (CORREÇÃO) EFEITO PARA INICIAR OS COMPLEMENTOS ---
  // Este useEffect agora SÓ define as opções padrão
  // quando os complementos chegam via props.
  useEffect(() => {
    if (complements && complements.length > 0) {
      const initialComplements: { [categoryId: string]: ComplementOption[] } = {}
      complements.forEach(category => {
        if (category.type === 'single' && category.options.length > 0) {
          initialComplements[category.id] = [category.options[0]]
        } else {
          initialComplements[category.id] = []
        }
      })
      setSelectedComplements(initialComplements)
    } else {
      setSelectedComplements({}) // Limpa se não houver complementos
    }
  }, [complements]) // Roda quando os complementos (props) mudam
  // --- FIM DA CORREÇÃO ---


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
        // Lógica de seleção múltipla
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
    const productDataForCart = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image_url || '',
      category: '',
      complements: complements, // Passa os complementos recebidos
    }
    // @ts-ignore
    addToCart(productDataForCart, quantity, selectedComplements, observation) 
    handleClose()
  }

  // Lógica do "arrastar para fechar"
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setIsDragging(true);
      setDragStartY(e.clientY); 
      if (modalRef.current) {
        modalRef.current.style.transition = 'none';
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartY === null || !modalRef.current) return;
    const currentY = e.clientY;
    const deltaY = currentY - dragStartY;
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartY === null || !modalRef.current) return;
    setIsDragging(false);
    setDragStartY(null);
    modalRef.current.style.transition = 'transform 0.3s ease-out';
    const currentY = e.clientY;
    const deltaY = currentY - dragStartY;
    const dragThreshold = 100; 
    if (deltaY > dragThreshold) {
      handleClose(); 
    } else {
      modalRef.current.style.transform = 'translateY(0)';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp} 
      >
        <button className={styles.closeButton} onClick={handleClose} aria-label="Fechar">
          <X size={24} />
        </button>
        
        <div 
          className={styles.scrollableArea}
          ref={scrollRef} 
        >
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

          {/* Renderizar complementos reais (agora vêm das props) */}
          {isLoadingComplements ? (
            <p style={{textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)'}}>A carregar opções...</p>
          ) : (
            complements.length > 0 && (
              <div className={styles.complementsSection}>
                {complements.map((category) => (
                  <div key={category.id} className={styles.complementCategory}>
                    <h3 className={styles.categoryTitle}>
                      {category.name}
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