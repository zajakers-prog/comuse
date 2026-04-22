'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const PRICES = [
  { id: 'promo_7d', label: '7 Days', price: '$9.99', days: 7 },
  { id: 'promo_14d', label: '14 Days', price: '$17.99', days: 14 },
  { id: 'promo_30d', label: '30 Days', price: '$29.99', days: 30 },
];

export default function PromotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branch');
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId: branchId ?? params.id, priceId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Boost Your Branch</h1>
      <p className="text-gray-600 mb-8">
        Promote your branch to get more visibility and attract collaborators.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PRICES.map((p) => (
          <div
            key={p.id}
            className="border border-gray-200 rounded-lg p-6 text-center hover:border-primary-300 transition"
          >
            <div className="text-lg font-semibold mb-1">{p.label}</div>
            <div className="text-3xl font-bold text-primary-600 mb-4">
              {p.price}
            </div>
            <button
              onClick={() => handleCheckout(p.id)}
              disabled={loading === p.id}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm"
            >
              {loading === p.id ? 'Redirecting...' : 'Select'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
