import { config } from 'dotenv';
// Works whether cwd is project root or server/ directory
config({ path: 'server/.env' });
config({ path: '.env' });
import express from 'express';
import cors from 'cors';
import ttsRouter from './routes/tts';

const app  = express();
const PORT = Number(process.env.PORT ?? 3001);

// Allow Vite dev server origins; tighten for production
app.use(cors({ origin: /localhost/ }));
app.use(express.json());

app.use('/api/tts', ttsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
