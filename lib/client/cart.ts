'use client';

import { useSyncExternalStore } from 'react';
import type { Format } from '@/lib/types';

export type CartItem = { issueId: string; format: Format };

const CART_KEY = 'agrovista_cart';
const listeners = new Set<() => void>();

function readRaw(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRaw(items: CartItem[]): void {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function addToCart(issueId: string, format: Format): void {
  const items = readRaw().filter((i) => i.issueId !== issueId);
  items.push({ issueId, format });
  writeRaw(items);
}

export function removeFromCart(issueId: string): void {
  writeRaw(readRaw().filter((i) => i.issueId !== issueId));
}

export function clearCart(): void {
  writeRaw([]);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Reactive hook — re-renders whenever the cart changes anywhere in the app. */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, readRaw, () => []);
}
