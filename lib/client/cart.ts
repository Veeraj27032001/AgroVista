'use client';

import { useSyncExternalStore } from 'react';
import type { Format } from '@/lib/types';

export type CartItem = { issueId: string; format: Format };

const CART_KEY = 'agrovista_cart';
const listeners = new Set<() => void>();

// getSnapshot (readSnapshot below) must return the same reference across
// calls when nothing changed, or useSyncExternalStore re-renders forever.
// Cache by the raw string so repeated reads of an unchanged cart are stable.
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = [];

function readSnapshot(): CartItem[] {
  if (typeof window === 'undefined') return cachedItems;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CART_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  try {
    cachedItems = raw ? JSON.parse(raw) : [];
  } catch {
    cachedItems = [];
  }
  return cachedItems;
}

function writeItems(items: CartItem[]): void {
  const raw = JSON.stringify(items);
  window.localStorage.setItem(CART_KEY, raw);
  cachedRaw = raw;
  cachedItems = items;
  listeners.forEach((l) => l());
}

export function addToCart(issueId: string, format: Format): void {
  const items = readSnapshot().filter((i) => i.issueId !== issueId);
  items.push({ issueId, format });
  writeItems(items);
}

export function removeFromCart(issueId: string): void {
  writeItems(readSnapshot().filter((i) => i.issueId !== issueId));
}

export function clearCart(): void {
  writeItems([]);
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Reactive hook — re-renders whenever the cart changes anywhere in the app. */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, readSnapshot, () => cachedItems);
}
