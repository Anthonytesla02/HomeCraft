import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import type { AndroidProjectFile } from './src/core/types.ts';
import { validateCodemagicTriggerInput } from './src/core/organizerEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ANDROID_DIR = path.resolve(__dirname, 'android-app');
const PORT = 3000;

function detectLanguage(filePath: string): AndroidProjectFile['language'] {
  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
  if (filePath.endsWith('.kt')) return 'kotlin';
  if (filePath.endsWith('.xml')) return 'xml';
  if (filePath.endsWith('.kts')) return 'gradle';
  return 'properties';
}

function collectAndroidFiles(dir: string, baseDir: string): AndroidProjectFile[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: AndroidProjectFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAndroidFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({
        path: relPath,
        language: detectLanguage(relPath),
        content: fs.readFileSync(fullPath, 'utf-8'),
      });
    }
  }

  return results.sort((a, b) => {
    if (a.path === 'codemagic.yaml') return -1;
    if (b.path === 'codemagic.yaml') return 1;
    return a.path.localeCompare(b.path);
  });
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/android-files', (_req, res) => {
    const files = collectAndroidFiles(ANDROID_DIR, ANDROID_DIR);
    res.json({ files });
  });

  app.get('/api/export-android-zip', async (_req, res) => {
    try {
      const files = collectAndroidFiles(ANDROID_DIR, ANDROID_DIR);
      const zip = new JSZip();
      for (const file of files) {
        zip.file(file.path, file.content);
      }
      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="HomeCraft-Android-Organizer.zip"');
      res.setHeader('Content-Length', String(buffer.length));
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build archive';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/codemagic/trigger', async (req, res) => {
    const body = req.body ?? {};
    const payload = {
      apiToken: typeof body.apiToken === 'string' ? body.apiToken.trim() : '',
      appId: typeof body.appId === 'string' ? body.appId.trim() : '',
      workflowId: typeof body.workflowId === 'string' ? body.workflowId.trim() : '',
      branch: typeof body.branch === 'string' ? body.branch.trim() : '',
    };

    const validation = validateCodemagicTriggerInput(payload);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Validation failed',
        fieldErrors: validation.errors,
      });
      return;
    }

    try {
      const cmResponse = await fetch('https://api.codemagic.io/builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': payload.apiToken,
        },
        body: JSON.stringify({
          appId: payload.appId,
          workflowId: payload.workflowId,
          branch: payload.branch,
        }),
      });

      const responseData = (await cmResponse.json().catch(() => ({}))) as Record<string, unknown>;
      if (!cmResponse.ok) {
        res.status(cmResponse.status).json({
          error:
            typeof responseData.message === 'string'
              ? responseData.message
              : `Codemagic API returned status ${cmResponse.status}`,
          details: responseData,
        });
        return;
      }

      res.json({
        buildId: responseData.buildId,
        raw: responseData,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error calling Codemagic API';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/codemagic/builds/:buildId', async (req, res) => {
    const token = req.header('x-auth-token')?.trim() ?? '';
    const buildId = req.params.buildId?.trim() ?? '';

    if (!token || !buildId) {
      res.status(400).json({ error: 'Missing x-auth-token header or buildId parameter.' });
      return;
    }

    try {
      const cmResponse = await fetch(`https://api.codemagic.io/builds/${encodeURIComponent(buildId)}`, {
        headers: { 'x-auth-token': token },
      });
      const responseData = (await cmResponse.json().catch(() => ({}))) as Record<string, unknown>;
      if (!cmResponse.ok) {
        res.status(cmResponse.status).json({
          error:
            typeof responseData.message === 'string'
              ? responseData.message
              : `Codemagic API returned status ${cmResponse.status}`,
        });
        return;
      }
      res.json(responseData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to poll Codemagic build';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HomeCraft server running on http://0.0.0.0:${PORT}`);
  });
}

createServer();
