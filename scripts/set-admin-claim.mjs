/**
 * Script de emergência para definir o custom claim admin:true
 * Executar no terminal do Replit:
 *   node scripts/set-admin-claim.mjs
 *
 * Os secrets do Replit (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, etc.)
 * estão disponíveis no ambiente do terminal, mesmo que o Next.js não os veja.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ADMIN_EMAIL = 'kravmagaipiranga@gmail.com';
const ADMIN_UID   = 'QZ21oZmDqRO9ngBMQ5KHaGsZgEz2';
const PROJECT_ID  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                 || process.env.GCLOUD_PROJECT
                 || 'studio-659171913-ed391';

let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
privateKey = privateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';

if (!clientEmail || !privateKey) {
  console.error('❌ Credenciais ausentes:');
  console.error('   GOOGLE_CLIENT_EMAIL:', !!clientEmail);
  console.error('   GOOGLE_PRIVATE_KEY: ', !!privateKey);
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId: PROJECT_ID, clientEmail, privateKey }) });
}

const auth = getAuth();

try {
  // Confirm the user exists
  const user = await auth.getUserByEmail(ADMIN_EMAIL);
  console.log('✓ Usuário encontrado:', user.uid, '—', user.email);

  // Set the custom claim
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log('✓ Custom claim admin:true definido com sucesso!');

  // Verify
  const updated = await auth.getUser(user.uid);
  console.log('✓ Claims atuais:', JSON.stringify(updated.customClaims));
  console.log('');
  console.log('→ Agora faça LOGOUT e LOGIN no app para o token ser atualizado.');
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
}
