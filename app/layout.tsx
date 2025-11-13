import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { OrderProvider } from '@/context/OrderContext' // 1. IMPORTAR
import { AuthProvider } from '@/context/AuthContext' // 1. IMPORTAR

export const metadata = {
  title: 'Orla 33 - Premium Delivery',
  description: 'Premium Cuts & Coastal Flavors',
  manifest: '/manifest.json',
  themeColor: '#1a1a1a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Orla 33',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>{/* ... */}</head>
      <body>
        <AuthProvider> {/* 2. ADICIONAR O AUTHPROVIDER POR FORA */ }
          <CartProvider>
            <OrderProvider>
              {children}
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}