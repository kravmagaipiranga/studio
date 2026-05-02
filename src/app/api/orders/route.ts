import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import type { StoreOrderItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));

    const body = await request.json() as {
      studentId?: string;
      studentName?: string;
      items?: StoreOrderItem[];
      notes?: string;
    };

    const { studentId, studentName, items, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'studentId é obrigatório.' }, { status: 400 });
    }

    // Verify the studentId actually belongs to the authenticated user
    const db = getAdminFirestore();
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists || studentDoc.data()?.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const now = new Date().toISOString();
    const ref = await db.collection('pedidos').add({
      studentId,
      studentName: studentName ?? studentDoc.data()?.name ?? '',
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
