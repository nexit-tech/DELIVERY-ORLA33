import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
// 1. IMPORTA O createClient NORMAL
import { createClient } from '@supabase/supabase-js';

// 2. CONFIGURA O MERCADO PAGO (para verificar o pagamento)
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

// 3. CONFIGURA O SUPABASE COM A CHAVE SECRETA (ADMIN)
// Temos de fazer isto aqui porque este é um servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 4. O MERCADO PAGO AVISA SOBRE UM 'type: payment'
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // 5. Usa o SDK para buscar os dados desse pagamento
      const payment = new Payment(mpClient);
      const paymentInfo = await payment.get({ id: paymentId });

      console.log('Webhook MP Recebido:', paymentInfo);

      // 6. VERIFICA SE O PAGAMENTO FOI APROVADO
      if (paymentInfo.status === 'approved') {
        
        // Pega o ID do nosso pedido (que guardámos na descrição)
        const orderId = paymentInfo.description?.split('#')[1];

        if (orderId) {
          // 7. ATUALIZA O STATUS DO PEDIDO NO SUPABASE
          const { error } = await supabaseAdmin
            .from('orders')
            .update({ status: 'preparing' }) // <-- A MÁGICA ACONTECE AQUI
            .eq('id', orderId)
            .eq('status', 'pending'); // Segurança: Só atualiza se ainda estiver pendente

          if (error) {
            console.error('Erro ao atualizar status no Supabase:', error);
          } else {
            console.log(`Pedido ${orderId} atualizado para 'preparing'!`);
          }
        }
      }
    }

    // 8. Responde 200 OK para o Mercado Pago (para ele parar de mandar)
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no webhook do Mercado Pago:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}