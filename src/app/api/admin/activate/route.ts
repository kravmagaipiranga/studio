import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'kravmagaipiranga@gmail.com')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));

    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
      return NextResponse.json({ error: 'Este e-mail não está na lista de administradores.' }, { status: 403 });
    }

    await adminAuth.setCustomUserClaims(decoded.uid, { admin: true });

    return NextResponse.json({
      success: true,
      message: 'Permissão de administrador ativada. Faça logout e login novamente para aplicar.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/admin/activate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
