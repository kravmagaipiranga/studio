import * as admin from 'firebase-admin';

// Project ID is public — hardcoded as ultimate fallback since it already
// appears in the client bundle via firebase/config.ts
const FALLBACK_PROJECT_ID = 'studio-659171913-ed391';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Try every possible env var name for project ID
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    FALLBACK_PROJECT_ID;

  const clientEmail =
    process.env.GOOGLE_CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL;

  let privateKey =
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin SDK credentials missing. ` +
      `projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!privateKey}`
    );
  }

  if (!privateKey.includes('-----BEGIN')) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY does not look like a valid PEM key. ' +
      'It must start with -----BEGIN PRIVATE KEY----- with real newlines or \\n between lines.'
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}

export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return admin.firestore(app);
}
