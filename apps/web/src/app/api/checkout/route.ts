import { NextResponse } from 'next/server';
import { stripe, PROMOTION_PRICES } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { branchId, priceId } = await request.json();
    const price = PROMOTION_PRICES.find((p) => p.id === priceId);
    if (!price) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: price.currency,
            product_data: {
              name: `Branch Promotion - ${price.label}`,
              description: `Boost your branch visibility for ${price.days} days`,
            },
            unit_amount: price.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/projects/{CHECKOUT_SESSION_ID}?success=true`,
      cancel_url: `${request.headers.get('origin')}/projects/${branchId}?canceled=true`,
      metadata: {
        branchId,
        userId: user.id,
        days: price.days.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
