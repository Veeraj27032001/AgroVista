'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart, removeFromCart } from '@/lib/client/cart';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type CartLine = { issueId: string; title: string; posterUrl: string | null; format: string; price: number };

export default function CartPage() {
  const cart = useCart();
  const [lines, setLines] = useState<CartLine[] | null>(null);

  useEffect(() => {
    if (cart.length === 0) {
      setLines([]);
      return;
    }
    fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    })
      .then((r) => r.json())
      .then((data) => setLines(data.lines || []));
  }, [cart]);

  const subtotal = (lines || []).reduce((sum, l) => sum + l.price, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

      {!lines ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : lines.length === 0 ? (
        <p className="text-gray-500">
          Your cart is empty.{' '}
          <Link href="/archive" className="font-semibold text-primary">
            Browse issues
          </Link>
        </p>
      ) : (
        <>
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
            {lines.map((line) => (
              <div key={line.issueId} className="flex items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.posterUrl || undefined} alt={line.title} className="h-20 w-16 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-semibold">{line.title}</p>
                  <p className="text-sm capitalize text-gray-500">{line.format} copy</p>
                </div>
                <p className="font-semibold">₹{line.price}</p>
                <button onClick={() => removeFromCart(line.issueId)} className="text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-lg font-bold">Subtotal: ₹{subtotal}</span>
            <Link href="/checkout">
              <Button size="lg">Proceed to Checkout</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
