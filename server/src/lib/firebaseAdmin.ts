import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const BUCKET = 'supplysupport-233fe.firebasestorage.app';

function initAdmin() {
  if (getApps().length > 0) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  const parsed = JSON.parse(raw);
  // PEM private_key must have real newlines, not the literal \n dotenv may preserve
  if (parsed.private_key) {
    parsed.private_key = (parsed.private_key as string).replace(/\\n/g, '\n');
  }
  initializeApp({
    credential: cert(parsed),
    storageBucket: BUCKET,
  });
}

/** Returns the Storage bucket, initialising Firebase on first call. */
export function getBucket() {
  initAdmin();
  return getStorage().bucket(BUCKET);
}
