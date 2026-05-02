import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('products').where('active', '==', true).get();
    const products = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) =>
        String(a.category ?? '').localeCompare(String(b.category ?? ''), 'pt-BR') ||
        String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pt-BR')
      );
    return NextResponse.json({ products });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/products] error:', message);
    return NextResponse.json({ products: [], error: message });
  }
}
