import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https:;");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use(express.json({ limit: '4mb' }));

  // Serve MediaPipe Tasks Vision WASM locally so optional frame landmark preview works offline
  const mediapipeWasmDir = path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm');
  if (fs.existsSync(mediapipeWasmDir)) {
    app.use('/mediapipe-wasm', express.static(mediapipeWasmDir));
  }

  app.get('/api/health', (_req: Request, res: Response) => {
    res.type('application/json').json({
      ok: true,
      mode: 'teacher-guided',
      apiRequired: false,
    });
  });

  // Guard all unhandled /api/* endpoints so they always return JSON cleanly
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).type('application/json').json({
      error: 'Laluan API tidak ditemui.',
      code: 'API_NOT_FOUND',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Pecut 30 Meter berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
