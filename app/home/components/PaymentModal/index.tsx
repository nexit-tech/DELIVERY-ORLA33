'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Landmark, CircleDollarSign, Smartphone, Copy } from 'lucide-react'
import { PaymentMethod, Order } from '@/types' // Importar 'Order'
import styles from './styles.module.css'

interface PaymentModalProps {
  onClose: () => void
  onConfirmOrder: (paymentMethod: PaymentMethod, changeFor?: number) => Promise<Order> // 1. MUDAR PARA PROMISE<Order>
  totalPrice: number
  isLoading: boolean
}

export default function PaymentModal({ 
  onClose, 
  onConfirmOrder, 
  totalPrice, 
  isLoading 
}: PaymentModalProps) {
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('none')
  const [changeFor, setChangeFor] = useState('')

  // 2. NOVOS ESTADOS PARA O FLUXO PIX
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [pixScreen, setPixScreen] = useState(false) // Controla a "tela" do modal
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [qrCodeCopy, setQrCodeCopy] = useState<string | null>(null)
  const [pixError, setPixError] = useState<string | null>(null)


  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300) 
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // 3. ATUALIZAR O HANDLER DE CONFIRMAÇÃO
  const handleConfirm = async () => {
    if (selectedPayment === 'none') return;

    // --- Fluxo de Dinheiro / Cartão (normal) ---
    if (selectedPayment !== 'pix') {
      const changeAmount = selectedPayment === 'money' ? parseFloat(changeFor) : undefined;
      if (selectedPayment === 'money' && changeAmount && changeAmount < totalPrice) {
          alert('O valor do troco deve ser maior ou igual ao total do pedido.');
          return;
      }
      // Chama a função, mas não faz mais nada (a page.tsx cuida de fechar)
      onConfirmOrder(selectedPayment, changeAmount);
      return;
    }

    // --- Fluxo de PIX (Novo) ---
    setIsGeneratingPix(true);
    setPixError(null);
    
    try {
      // 1. Salva o pedido no Supabase PRIMEIRO (status: 'pending')
      // A função onConfirmOrder agora retorna o pedido que foi criado
      const newOrder = await onConfirmOrder(selectedPayment);
      
      // 2. Com o ID do pedido, gera o PIX no nosso backend
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: totalPrice,
          orderId: newOrder.id // Envia o ID real do pedido
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // 3. Salva os dados do PIX e muda a tela do modal
      setQrCodeBase64(data.qrCodeBase64);
      setQrCodeCopy(data.qrCodeCopy);
      setPixScreen(true); // Vira para a tela do PIX

    } catch (err: any) {
      console.error(err);
      setPixError("Não foi possível gerar o PIX. Tente outra forma de pagamento.");
    } finally {
      setIsGeneratingPix(false);
    }
  }

  const handleCopyPix = () => {
    if (qrCodeCopy) {
      navigator.clipboard.writeText(qrCodeCopy);
      alert("Código PIX copiado!");
    }
  }

  const paymentOptions = [
    { id: 'credit', name: 'Cartão de Crédito', icon: <CreditCard size={20} /> },
    { id: 'debit', name: 'Cartão de Débito', icon: <CreditCard size={20} /> },
    { id: 'money', name: 'Dinheiro', icon: <CircleDollarSign size={20} /> },
    { id: 'pix', name: 'Pix', icon: <Smartphone size={20} /> },
  ]

  // Se 'isLoading' (do PWA) ou 'isGeneratingPix' (do PIX) estiverem ativos
  const isProcessing = isLoading || isGeneratingPix;

  return (
    <div 
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ''}`}>
        
        {/* --- TELA 2: MOSTRAR O PIX --- */}
        {pixScreen && qrCodeBase64 ? (
          <>
            <div className={styles.header}>
              <h2>Pague com PIX</h2>
              <button className={styles.closeButton} onClick={handleClose}>
                <X size={24} />
              </button>
            </div>
            <div className={`${styles.scrollableArea} ${styles.pixContainer}`}>
              <p className={styles.pixDescription}>
                1. Abra o app do seu banco e escaneie o QR Code.
              </p>
              <img 
                src={`data:image/jpeg;base64,${qrCodeBase64}`} 
                alt="PIX QR Code"
                className={styles.qrCodeImage}
              />
              <p className={styles.pixDescription}>
                2. Ou use o PIX Copia e Cola:
              </p>
              <button className={styles.copyPixButton} onClick={handleCopyPix}>
                <Copy size={16} /> Copiar Código
              </button>
              <p className={styles.pixWaiting}>
                Aguardando o pagamento...
              </p>
              <p className={styles.pixNote}>
                O seu pedido só será confirmado após o pagamento. Você pode acompanhar o status na tela "Meus Pedidos".
              </p>
            </div>
            <div className={styles.footer}>
              <button 
                className={styles.confirmButton} 
                onClick={handleClose}
              >
                Fechar (Já paguei)
              </button>
            </div>
          </>
        
        /* --- TELA 1: SELECIONAR PAGAMENTO (Original) --- */
        ) : (
          <>
            <div className={styles.header}>
              <h2>Pagamento</h2>
              <button className={styles.closeButton} onClick={handleClose}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.scrollableArea}>
              <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>Total</h3>
                <span className={styles.totalPrice}>R${totalPrice.toFixed(2)}</span>
              </div>

              <div className={styles.paymentSection}>
                <h3 className={styles.sectionTitle}>Forma de Pagamento</h3>
                <div className={styles.optionsList}>
                  {paymentOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`${styles.optionItem} ${selectedPayment === option.id ? styles.selected : ''}`}
                      onClick={() => setSelectedPayment(option.id as PaymentMethod)}
                    >
                      <div className={styles.optionIcon}>{option.icon}</div>
                      <span className={styles.optionName}>{option.name}</span>
                      <span className={styles.checkboxIndicator}></span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPayment === 'money' && (
                <div className={styles.paymentSection}>
                  <h3 className={styles.sectionTitle}>Troco</h3>
                  <p className={styles.sectionDescription}>
                    Precisa de troco para quanto? (Deixe em branco se não precisar)
                  </p>
                  <div className={styles.inputGroup}>
                    <span>R$</span>
                    <input
                      type="number"
                      placeholder="50,00"
                      className={styles.changeInput}
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* MENSAGEM DE ERRO DO PIX */}
              {pixError && (
                <p className={styles.pixError}>{pixError}</p>
              )}
            </div>

            <div className={styles.footer}>
              <button 
                className={styles.confirmButton} 
                onClick={handleConfirm}
                disabled={selectedPayment === 'none' || isProcessing}
              >
                {isGeneratingPix ? 'Gerando PIX...' : (isLoading ? 'Processando...' : 'Confirmar Pedido')}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}