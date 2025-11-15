// lib/hooks/useSwipeToClose.ts

import { useRef, useState, RefObject, useEffect } from 'react'

interface UseSwipeToCloseProps {
  modalRef: RefObject<HTMLDivElement>
  scrollRef: RefObject<HTMLDivElement>
  onClose: () => void
}

const DRAG_THRESHOLD = 100 // Distância em pixels para fechar

export const useSwipeToClose = ({ modalRef, scrollRef, onClose }: UseSwipeToCloseProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Só começa a arrastar se o scroll interno estiver no topo
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setIsDragging(true)
      dragStartY.current = e.clientY
      
      // Desativa a transição CSS para o "arraste" ser 1:1
      if (modalRef.current) {
        modalRef.current.style.transition = 'none'
      }
    } else {
      // Se o scroll não estiver no topo, cancela qualquer arraste
      setIsDragging(false)
      dragStartY.current = null
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartY.current === null || !modalRef.current) return

    const currentY = e.clientY
    const deltaY = currentY - dragStartY.current

    // Só permite arrastar para BAIXO (deltaY > 0)
    if (deltaY > 0) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handlePointerUpOrLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartY.current === null || !modalRef.current) return

    setIsDragging(false)
    
    // Reativa a transição para a animação
    if (modalRef.current) {
      modalRef.current.style.transition = 'transform 0.3s ease-out'
    }

    const currentY = e.clientY
    const deltaY = currentY - dragStartY.current

    if (deltaY > DRAG_THRESHOLD) {
      onClose() // Chama a função de fechar
    } else {
      // "Snap back" - Volta ao normal
      if (modalRef.current) {
        modalRef.current.style.transform = 'translateY(0)'
      }
    }
    dragStartY.current = null
  }

  // Retorna os eventos para "espalhar" no modal
  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUpOrLeave,
    onPointerLeave: handlePointerUpOrLeave, // Cancela se o dedo sair da tela
  }
}