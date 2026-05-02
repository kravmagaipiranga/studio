import * as admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey) {
    // Remove surrounding quotes if the secret was stored with them
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    // Replace literal \n sequences with actual newlines (common when pasting JSON values)
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
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
