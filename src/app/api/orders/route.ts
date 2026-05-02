import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));

    const body = await request.json();
    const { studentId, studentName, items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
    }

    const total = (items as any[]).reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const now = new Date().toISOString();
    const db = getAdminFirestore();
    const ref = await db.collection('pedidos').add({
      studentId: studentId ?? '',
      studentName: studentName ?? '',
      uid: decoded.uid,
      items,
      total,
      status: 'pendente',
      notes: notes ?? '',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, orderId: ref.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/orders] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
