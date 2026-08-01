import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import { getBucket } from '../lib/firebaseAdmin';

const router = Router();

const TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/** Get a short-lived OAuth2 access token from the service account. */
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

/** Call Google Cloud Text-to-Speech and return MP3 bytes. */
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
      // he-IL-Wavenet-A: high-quality Hebrew female voice
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

/** Keep Hebrew words readable in storage while removing unsafe path characters. */
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

/** Public GCS URL — permanent, no expiry, accessible without auth token. */
function publicUrl(filePath: string): string {
  return `https://storage.googleapis.com/${getBucket().name}/${filePath}`;
}


router.post('/', async (req: Request, res: Response) => {
  try {
    const text = (req.body?.text ?? '').trim().slice(0, 500) as string;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const fileName = makeReadableFileName(text);
    const filePath = `audio/hebrew/${fileName}`;
    const file     = getBucket().file(filePath);

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

    console.log(`[tts] uploaded   → ${fileName} (${mp3.length} bytes)`);
    return res.json({ url: publicUrl(filePath), cached: false });

  } catch (err) {
    console.error('[tts] error:', err);
    return res.status(500).json({ error: 'TTS generation failed' });
  }
});

export default router;
