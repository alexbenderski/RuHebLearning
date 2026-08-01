import { createHash } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import admin from 'firebase-admin';

// Vercel Request/Response types (compatible with req.body / res.json)
type VercelRequest = any;
type VercelResponse = any;

const BUCKET = 'supplysupport-233fe.firebasestorage.app';

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  const parsed = JSON.parse(raw);
  if (parsed.private_key) {
    parsed.private_key = (parsed.private_key as string).replace(/\\n/g, '\n');
  }
  admin.initializeApp({
    credential: admin.credential.cert(parsed),
    storageBucket: BUCKET,
  });
}

function getBucket() {
  initAdmin();
  return admin.storage().bucket(BUCKET);
}

const TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

async function getAccessToken(): Promise<string> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  const credentials = JSON.parse(raw);
  if (credentials.private_key) {
    credentials.private_key = (credentials.private_key as string).replace(/\\n/g, '\n');
  }
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error('Failed to obtain access token');
  return token;
}

async function cloudTTS(text: string): Promise<Buffer> {
  const token = await getAccessToken();
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'he-IL', name: 'he-IL-Wavenet-A', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloud TTS ${res.status}: ${body.slice(0, 400)}`);
  }

  const data = await res.json() as { audioContent: string };
  if (!data.audioContent) throw new Error('No audioContent in Cloud TTS response');
  return Buffer.from(data.audioContent, 'base64');
}

function makeReadableFileName(text: string): string {
  const cleaned = text
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .slice(0, 90);

  if (cleaned) return `${cleaned}.mp3`;
  return `${createHash('md5').update(text, 'utf8').digest('hex')}.mp3`;
}

function publicUrl(filePath: string): string {
  return `https://storage.googleapis.com/${BUCKET}/${filePath}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const text = (req.body?.text ?? '').trim().slice(0, 500) as string;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const fileName = makeReadableFileName(text);
    const filePath = `audio/hebrew/${fileName}`;
    const file = getBucket().file(filePath);

    // ── Step A: Cache lookup ──────────────────────────────────────────
    const [exists] = await file.exists();
    if (exists) {
      console.log(`[tts] cache hit  → ${fileName}`);
      return res.json({ url: publicUrl(filePath), cached: true });
    }

    // ── Step B: Synthesise via Cloud TTS + upload ─────────────────────
    console.log(`[tts] generating → "${text.slice(0, 30)}" (${fileName})`);

    const mp3 = await cloudTTS(text);

    await file.save(mp3, {
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000',
      },
    });
    await file.makePublic();

    return res.json({ url: publicUrl(filePath), cached: false });
  } catch (error: any) {
    console.error('[tts error]', error);
    return res.status(500).json({ error: error.message });
  }
}
