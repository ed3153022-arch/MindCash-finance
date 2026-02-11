import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ usar service role
);

const KIWIFY_WEBHOOK_TOKEN = process.env.KIWIFY_WEBHOOK_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-webhook-token');

    if (token !== KIWIFY_WEBHOOK_TOKEN) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await req.json();

    console.log('Webhook recebida:', body);

    const evento = body?.event;
    const email = body?.customer?.email;

    if (!email) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 400 });
    }

    // ✅ ATIVAR PREMIUM
    if (
      evento === 'compra_aprovada' ||
      evento === 'assinatura_renovada'
    ) {
      const { error } = await supabase
        .from('users')
        .update({ plan: 'premium' })
        .eq('email', email);

      if (error) {
        console.error('Erro ao ativar premium:', error);
      }

      console.log('Premium ativado para:', email);
    }

    // ❌ REMOVER PREMIUM
    if (
      evento === 'assinatura_cancelada' ||
      evento === 'reembolso'
    ) {
      const { error } = await supabase
        .from('users')
        .update({ plan: 'free' })
        .eq('email', email);

      if (error) {
        console.error('Erro ao remover premium:', error);
      }

      console.log('Premium removido para:', email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
