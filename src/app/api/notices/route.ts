import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Notice } from '@/lib/types';

export async function GET() {
  try {
    const firestore = getAdminFirestore();
    // No orderBy — avoids composite index requirement; sorted server-side below
    const snap = await firestore
      .collection('notices')
      .where('active', '==', true)
      .get();

    const notices: Notice[] = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Notice))
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ notices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/notices] error:', message);
    return NextResponse.json({ notices: [], error: message }, { status: 200 });
  }
}
