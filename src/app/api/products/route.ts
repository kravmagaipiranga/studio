import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Product } from '@/lib/types';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('products').where('active', '==', true).get();

    const products: Product[] = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
      .sort((a, b) => {
        const sa = a.sortOrder ?? Infinity;
        const sb = b.sortOrder ?? Infinity;
        if (sa !== sb) return sa - sb;
        return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-BR');
      });

    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/products] error:', message);
    return NextResponse.json({ products: [], error: message });
  }
}
