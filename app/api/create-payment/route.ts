import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { totalAmount, orderId } = await req.json();

    if (!totalAmount || !orderId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const payment = new Payment(client);

    // --- A CORREÇÃO ESTÁ AQUI ---
    // 1. Pega o URL que o ngrok te deu (ex: https://abcd-1234.ngrok.io)
    // !! IMPORTANTE: Este URL tem de ser o teu URL HTTPS do NGROK
    const publicUrl = "https://7795e546f863.ngrok-free.app"; 
    // --- FIM DA CORREÇÃO ---
    
    const paymentData = {
      transaction_amount: totalAmount,
      description: `Pedido Orla33 #${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: `cliente_${orderId}@orla33.com`, 
        first_name: 'Cliente',
        last_name: 'Orla33',
      },
      // 2. Agora a URL é válida
      notification_url: `${publicUrl}/api/webhook-mercadopago`,
    };

    const result = await payment.create({ body: paymentData });

    if (!result.point_of_interaction?.transaction_data) {
      console.error("Resposta inesperada do MP:", result);
      throw new Error('Resposta inválida do Mercado Pago ao gerar PIX');
    }

    const qrCodeBase64 = result.point_of_interaction.transaction_data.qr_code_base64;
    const qrCodeCopy = result.point_of_interaction.transaction_data.qr_code;

    return NextResponse.json({
      qrCodeBase64,
      qrCodeCopy,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error);
    return NextResponse.json({ error: error.message || 'Falha ao gerar PIX' }, { status: 500 });
  }
}