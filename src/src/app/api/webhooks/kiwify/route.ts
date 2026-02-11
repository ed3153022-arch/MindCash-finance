import { NextRequest, NextResponse } from 'next/server';

/**
 * ⚠️ IMPORTANTE
 * Depois você deve validar a assinatura da Kiwify
 * Aqui estamos começando simples
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('Webhook Kiwify recebida:', body);

    const {
      event,
      customer,
      subscription,
    } = body;

    /**
     * Eventos importantes:
     * subscription.approved
     * subscription.renewed
     * subscription.canceled
     * subscription.refunded
     */

    if (
      event === 'subscription.approved' ||
      event === 'subscription.renewed'
    ) {
      const email = customer?.email;

      // 🔥 AQUI você atualiza o usuário no banco
      console.log(`Ativar premium para: ${email}`);

      // TODO:
      // await db.user.update({
      //   where: { email },
      //   data: { plan: 'premium' }
      // });
    }

    if (
      event === 'subscription.canceled' ||
      event === 'subscription.refunded'
    ) {
      const email = customer?.email;

      console.log(`Cancelar premium para: ${email}`);

      // TODO:
      // await db.user.update({
      //   where: { email },
      //   data: { plan: 'free' }
      // });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
