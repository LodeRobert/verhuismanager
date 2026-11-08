import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/routes.ts';
import { loadDatabase } from './server/db.ts';

process.on('uncaughtException', (err) => {
  console.error('Onverwachte serverfout:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Niet-afgehandelde promise rejectie:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // JSON Body parsing
  app.use(express.json());

  // Initialize DB & Bootstrap check on startup
  try {
    loadDatabase();
  } catch (err) {
    console.error('Fout bij initialiseren van de database:', err);
  }

  // Direct download routes for updating local Docker hosts without git
  app.get('/download/update.zip', (_req, res) => {
    const zipPath = path.resolve(__dirname, 'public/verhuismanager-update.zip');
    res.download(zipPath, 'verhuismanager-update.zip');
  });

  app.get('/download/update.tar.gz', (_req, res) => {
    const tarPath = path.resolve(__dirname, 'public/verhuismanager.tar.gz');
    res.download(tarPath, 'verhuismanager.tar.gz');
  });

  // Mount API router
  app.use('/api', apiRouter);

  if (!isProduction) {
    // Development mode: Mount Vite dev middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    // When bundled in dist/server.js, index.html is directly in __dirname
    // When run directly with tsx/node server.ts, index.html is in path.resolve(__dirname, 'dist')
    const distPath = fs.existsSync(path.resolve(__dirname, 'index.html'))
      ? __dirname
      : path.resolve(__dirname, 'dist');

    console.log(`Statische bestanden worden geserveerd vanuit: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Index.html niet gevonden in ' + distPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VerhuisManager draait op http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch(err => {
  console.error('Fatale fout bij starten van de server:', err);
});
