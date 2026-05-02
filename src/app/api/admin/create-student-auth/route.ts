import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { firebaseConfig } from '@/firebase/config';

type AdminCheckResult =
  | { status: 'ok'; uid: string }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' };

/**
 * Verifies the request Bearer token and confirms the caller is an admin.
 *
 * Admin authorization strategy (in order):
 * 1. Firebase custom claim `admin === true` on the decoded token (preferred).
 * 2. Presence of a document in the `admins/{uid}` Firestore collection (allowlist).
 *
 * To bootstrap: add a document at `admins/{uid}` via the Firebase Console,
 * or set the `admin` custom claim via the Firebase Admin SDK.
 */
async function checkAdminAccess(request: NextRequest): Promise<AdminCheckResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 'unauthenticated' };
  }
  const idToken = authHeader.slice(7);
  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded['admin'] === true) {
      return { status: 'ok', uid: decoded.uid };
    }

    const firestore = getAdminFirestore();
    const adminDoc = await firestore.collection('admins').doc(decoded.uid).get();

    if (!adminDoc.exists) {
      return { status: 'forbidden' };
    }

    return { status: 'ok', uid: decoded.uid };
  } catch (err) {
    console.error('[create-student-auth] token verification failed:', err);
    return { status: 'unauthenticated' };
  }
}

async function sendPasswordResetEmail(email: string): Promise<void> {
  const apiKey =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;

  if (!apiKey) {
    throw new Error('Firebase API key not configured.');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.error?.message || 'Falha ao enviar email de redefinição de senha.');
  }
}

export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);

  if (access.status === 'unauthenticated') {
    return NextResponse.json(
      { error: 'Não autenticado. Faça login para continuar.' },
      { status: 401 }
    );
  }

  if (access.status === 'forbidden') {
    return NextResponse.json(
      { error: 'Acesso negado. Esta ação é restrita a administradores.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { studentId, email } = body;

    if (!studentId || !email) {
      return NextResponse.json(
        { error: 'studentId e email são obrigatórios.' },
        { status: 400 }
      );
    }

    const firestore = getAdminFirestore();

    const studentDoc = await firestore.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: 'Aluno não encontrado.' },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();

    if (studentData?.email && studentData.email !== email) {
      return NextResponse.json(
        { error: 'O email fornecido não corresponde ao email cadastrado do aluno.' },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();

    let uid: string;
    try {
      const existingUser = await auth.getUserByEmail(email);
      uid = existingUser.uid;
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        const newUser = await auth.createUser({
          email,
          emailVerified: false,
        });
        uid = newUser.uid;
      } else {
        throw error;
      }
    }

    const duplicateSnap = await firestore
      .collection('students')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== studentId) {
      return NextResponse.json(
        { error: 'Este UID já está vinculado a outro aluno.' },
        { status: 409 }
      );
    }

    await firestore.collection('students').doc(studentId).update({
      userId: uid,
    });

    let emailWarning: string | undefined;
    try {
      await sendPasswordResetEmail(email);
    } catch (emailError: unknown) {
      const err = emailError as { message?: string };
      console.error('Aviso: userId vinculado, mas email de redefinição falhou:', err.message);
      emailWarning = `Acesso vinculado, mas o email de redefinição de senha não pôde ser enviado: ${err.message || 'erro desconhecido'}. O aluno pode usar "Esqueci minha senha" no portal.`;
    }

    return NextResponse.json({
      success: true,
      uid,
      message: emailWarning
        ? emailWarning
        : 'Acesso criado com sucesso. Email de redefinição de senha enviado.',
      emailSent: !emailWarning,
    });
  } catch (error: unknown) {
    console.error('Erro ao criar acesso do aluno:', error);
    const err = error as { message?: string; code?: string };

    return NextResponse.json(
      { error: err.message || 'Erro interno ao criar acesso.' },
      { status: 500 }
    );
  }
}
