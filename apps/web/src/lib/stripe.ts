import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const PROMOTION_PRICES = [
  { id: 'promo_7d', label: '7 Days', days: 7, amount: 999, currency: 'usd' },
  { id: 'promo_14d', label: '14 Days', days: 14, amount: 1799, currency: 'usd' },
  { id: 'promo_30d', label: '30 Days', days: 30, amount: 2999, currency: 'usd' },
] as const;
