import admin from 'firebase-admin';

const BUCKET = 'supplysupport-233fe.firebasestorage.app';

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  const parsed = JSON.parse(raw);
  // PEM private_key must have real newlines, not the literal \n dotenv may preserve
  if (parsed.private_key) {
    parsed.private_key = (parsed.private_key as string).replace(/\\n/g, '\n');
  }
  admin.initializeApp({
    credential: admin.credential.cert(parsed as admin.ServiceAccount),
    storageBucket: BUCKET,
  });
}

/** Returns the Storage bucket, initialising Firebase on first call. */
export function getBucket() {
  initAdmin();
  return admin.storage().bucket(BUCKET);
}
