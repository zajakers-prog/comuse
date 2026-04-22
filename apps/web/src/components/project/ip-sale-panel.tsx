'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type IpSale = {
  id: string;
  asking_price: number | null;
  currency: string;
  description: string | null;
  status: string;
  buyer_name: string | null;
  sold_at: string | null;
  created_at: string;
  listed_by: string;
};

export function IpSalePanel({ projectId, creatorId }: { projectId: string; creatorId: string }) {
  const supabase = createClient();
  const [sales, setSales] = useState<IpSale[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ asking_price: '', currency: 'USD', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data } = await supabase
        .from('ip_sales')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setSales(data ?? []);
    }
    load();
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const { data, error } = await supabase.from('ip_sales').insert({
      project_id: projectId,
      listed_by: userId,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      currency: form.currency,
      description: form.description || null,
    }).select().single();

    if (!error && data) {
      setSales((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ asking_price: '', currency: 'USD', description: '' });
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('ip_sales').update({ status }).eq('id', id);
    setSales((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  }

  const isCreator = userId === creatorId;
  const hasOpenSale = sales.some((s) => s.status === 'open');

  const statusColor: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    negotiating: 'bg-yellow-100 text-yellow-700',
    sold: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="mt-8 border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">IP Sale</h2>
        {isCreator && !hasOpenSale && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + List for Sale
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Asking price (optional)"
              value={form.asking_price}
              onChange={(e) => setForm((f) => ({ ...f, asking_price: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option>USD</option>
              <option>ETH</option>
              <option>KRW</option>
            </select>
          </div>
          <textarea
            placeholder="Description for buyers..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'List IP'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sales.length === 0 ? (
        <p className="text-sm text-gray-400">Not listed for sale.</p>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div key={sale.id} className="p-4 border border-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[sale.status] ?? ''}`}>
                    {sale.status}
                  </span>
                  {sale.asking_price && (
                    <span className="text-sm font-semibold">
                      {sale.asking_price.toLocaleString()} {sale.currency}
                    </span>
                  )}
                </div>
                {isCreator && sale.status === 'open' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateStatus(sale.id, 'negotiating')}
                      className="text-xs px-2 py-1 border border-yellow-200 text-yellow-700 rounded hover:bg-yellow-50 transition"
                    >
                      Negotiating
                    </button>
                    <button
                      onClick={() => updateStatus(sale.id, 'sold')}
                      className="text-xs px-2 py-1 border border-blue-200 text-blue-700 rounded hover:bg-blue-50 transition"
                    >
                      Mark Sold
                    </button>
                    <button
                      onClick={() => updateStatus(sale.id, 'closed')}
                      className="text-xs px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
              {sale.description && (
                <p className="text-sm text-gray-600 mt-1">{sale.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Listed {new Date(sale.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
