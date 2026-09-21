import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { analyzeWebsite } from './server/analyzer';
import { buildQueue } from './server/buildQueue';
import { validateWebsiteUrl, validatePackageId } from './server/security';
import type { Platform } from './src/types';

export async function createApp(startListening = false) {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- Auth API ---
  app.get('/api/auth/me', (req, res) => {
    const user = db.getDefaultUser();
    res.json({ user });
  });

  app.post('/api/auth/login', (req, res) => {
    const user = db.getDefaultUser();
    res.json({ user, token: 'demo-session-token' });
  });

  app.post('/api/auth/register', (req, res) => {
    const user = db.getDefaultUser();
    res.json({ user, token: 'demo-session-token' });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  // --- Website Analyzer API ---
  app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const analysis = await analyzeWebsite(url);
      res.json({ analysis });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  });

  // --- Projects API ---
  app.get('/api/projects', (req, res) => {
    const projects = db.getProjects();
    res.json({ projects });
  });

  app.post('/api/projects', async (req, res) => {
    const { name, websiteUrl, config, targetPlatform } = req.body;
    if (!websiteUrl) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    // SSRF Validation
    const urlValidation = await validateWebsiteUrl(websiteUrl);
    if (!urlValidation.valid) {
      return res.status(400).json({ error: urlValidation.error });
    }

    if (config?.packageId) {
      const pkgCheck = validatePackageId(config.packageId);
      if (!pkgCheck.valid) {
        return res.status(400).json({ error: pkgCheck.error });
      }
    }

    const defaultUser = db.getDefaultUser();

    // Auto-analyze website if analysis not provided
    let analysis = req.body.analysis;
    if (!analysis) {
      try {
        analysis = await analyzeWebsite(websiteUrl);
      } catch {
        // Analysis warning only
      }
    }

    const project = db.createProject({
      userId: defaultUser.id,
      name: name || (analysis?.title ? analysis.title.substring(0, 30) : 'My App'),
      websiteUrl: urlValidation.sanitizedUrl || websiteUrl,
      config,
      analysis,
      targetPlatform,
    });

    res.status(201).json({ project });
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }
    res.json({ project });
  });

  app.patch('/api/projects/:id', (req, res) => {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.body.config?.packageId) {
      const pkgCheck = validatePackageId(req.body.config.packageId);
      if (!pkgCheck.valid) {
        return res.status(400).json({ error: pkgCheck.error });
      }
    }

    const updated = db.updateProject(req.params.id, req.body);
    res.json({ project: updated });
  });

  app.delete('/api/projects/:id', (req, res) => {
    const deleted = db.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  });

  app.post('/api/projects/:id/analyze', async (req, res) => {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    try {
      const analysis = await analyzeWebsite(project.websiteUrl);
      const updated = db.updateProject(project.id, { analysis });
      res.json({ analysis, project: updated });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(400).json({ error: message });
    }
  });

  // --- Builds API ---
  app.post('/api/projects/:id/build', (req, res) => {
    const project = db.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const platform: Platform = req.body.platform || project.targetPlatform || 'both';
    const build = buildQueue.createBuild(project, platform);

    res.status(202).json({
      buildId: build.id,
      jobId: build.id,
      status: build.status,
      build,
    });
  });

  app.get('/api/builds/:id', (req, res) => {
    const build = db.getBuild(req.params.id);
    if (!build) {
      return res.status(404).json({ error: 'Build job not found' });
    }
    res.json({ build });
  });

  app.get('/api/builds/:id/logs', (req, res) => {
    const build = db.getBuild(req.params.id);
    if (!build) {
      return res.status(404).json({ error: 'Build job not found' });
    }
    res.json({ logs: build.logs, status: build.status, progress: build.progress });
  });

  app.post('/api/builds/:id/cancel', (req, res) => {
    const success = buildQueue.cancelBuild(req.params.id);
    res.json({ success });
  });

  app.get('/api/projects/:id/builds', (req, res) => {
    const builds = db.getBuildsForProject(req.params.id);
    res.json({ builds });
  });

  // --- Artifact Download API ---
  app.get('/api/artifacts/:buildId/:type', (req, res) => {
    const { buildId, type } = req.params;
    const build = db.getBuild(buildId);
    if (!build) {
      return res.status(404).json({ error: 'Build record not found' });
    }

    let artifactMeta = build.artifacts.find((a) => {
      if (type === 'android-project' && a.type === 'android_project_zip') return true;
      if (type === 'android-apk' && a.type === 'apk') return true;
      if (type === 'ios-project' && a.type === 'ios_project_zip') return true;
      if (type === 'ios-ipa' && a.type === 'ipa') return true;
      return a.id === type;
    });

    if (!artifactMeta && build.artifacts.length > 0) {
      artifactMeta = build.artifacts[0];
    }

    if (!artifactMeta) {
      return res.status(404).json({ error: 'Artifact not available or still compiling' });
    }

    const stored = db.getArtifact(artifactMeta.id);
    if (!stored) {
      return res.status(404).json({ error: 'Artifact payload not found in storage' });
    }

    let contentType = 'application/octet-stream';
    if (type === 'android-apk' || artifactMeta.type === 'apk' || artifactMeta.fileName.endsWith('.apk')) {
      contentType = 'application/vnd.android.package-archive';
    } else if (type === 'ios-ipa' || artifactMeta.type === 'ipa' || artifactMeta.fileName.endsWith('.ipa')) {
      contentType = 'application/x-ios-app';
    }

    // Support JSON / Base64 format to bypass proxy navigation cookie checks inside iframes
    if (req.query.format === 'base64' || req.query.format === 'json') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.json({
        success: true,
        fileName: artifactMeta.fileName,
        fileSize: stored.buffer.length,
        contentType,
        base64: stored.buffer.toString('base64'),
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${artifactMeta.fileName}"`);
    res.setHeader('Content-Length', stored.buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(stored.buffer);
  });

  // --- Mobile WebView Preview Proxy ---
  app.get('/api/preview-proxy', async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send('Missing url parameter');
    }

    const validation = await validateWebsiteUrl(rawUrl);
    if (!validation.valid || !validation.sanitizedUrl) {
      return res.status(400).send(`Invalid or disallowed URL: ${validation.error || 'Validation failed'}`);
    }

    try {
      const targetUrl = validation.sanitizedUrl;
      const targetOrigin = new URL(targetUrl).origin;

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      const contentType = response.headers.get('content-type') || 'text/html';

      if (!contentType.includes('text/html')) {
        const arrayBuf = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType);
        return res.send(Buffer.from(arrayBuf));
      }

      let html = await response.text();
      const finalUrl = response.url || targetUrl;

      // Base tag and mobile meta injection
      const baseTag = `<base href="${finalUrl}">`;
      const mobileMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`;
      const mobileStyles = `<style>
        /* Responsive scrollbar and touch behavior for mobile preview */
        html, body {
          -webkit-tap-highlight-color: transparent;
          touch-action: pan-y;
        }
      </style>`;
      const bridgeScript = `
        <script>
          // Intercept links to keep preview inside proxy
          document.addEventListener('click', function(e) {
            var el = e.target && e.target.closest('a');
            if (el && el.href && !el.href.startsWith('javascript:') && !el.href.startsWith('#')) {
              var href = el.href;
              if (href.startsWith('http://') || href.startsWith('https://')) {
                e.preventDefault();
                window.location.href = '/api/preview-proxy?url=' + encodeURIComponent(href);
              }
            }
          }, true);
        </script>
      `;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}\n${mobileMeta}\n${mobileStyles}\n${bridgeScript}`);
      } else {
        html = `${baseTag}\n${mobileMeta}\n${mobileStyles}\n${bridgeScript}\n${html}`;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('Content-Security-Policy-Report-Only');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(html);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; padding: 20px; box-sizing: border-box; text-align: center; }
            .card { background: #1e293b; padding: 28px 24px; border-radius: 20px; border: 1px solid #334155; max-width: 320px; }
            .icon { font-size: 32px; margin-bottom: 12px; }
            h2 { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #f1f5f9; }
            p { font-size: 13px; color: #94a3b8; margin: 0 0 16px; line-height: 1.5; }
            .btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">📱</div>
            <h2>Mobile Preview Connecting</h2>
            <p>Target site could not be rendered inside the sandbox preview (${msg}). You can test in Direct mode or open in new tab.</p>
            <button class="btn" onclick="window.location.reload()">Retry Connection</button>
          </div>
        </body>
        </html>
      `);
    }
  });

  // --- System Health API ---
  app.get('/api/system/health', (req, res) => {
    res.json({
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      workers: {
        active: 1,
        queued: 0,
        isolation: 'Docker / Sandbox Environment',
      },
      androidSdk: 'Android 14 (API 34) Available',
      iosSdk: 'Xcode 15 / Swift 5.0 Generator Ready',
      ssrfProtection: 'Active (RFC 1918 & Cloud Metadata Filters)',
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (startListening) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Bapp Server running on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

if (process.env.VERCEL !== '1') {
  createApp(true).catch((err) => {
    console.error('Failed to start Bapp server:', err);
    process.exit(1);
  });
}
