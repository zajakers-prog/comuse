import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { branchId, userId, days } = session.metadata!;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const startAt = new Date();
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + parseInt(days));

    await supabase.from('promotions').insert({
      branch_id: branchId,
      user_id: userId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      payment_id: session.payment_intent as string,
      amount: (session.amount_total ?? 0) / 100,
    });

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'promotion',
      reference_id: branchId,
    });
  }

  return NextResponse.json({ received: true });
}
