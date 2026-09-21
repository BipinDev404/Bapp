import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import forge from 'node-forge';
import { signApk } from 'apk_sign_ts';
import sharp from 'sharp';
import type { Project, ProjectConfig } from '../../src/types';

// In-memory cached debug signing credentials
let cachedKeyPem: string | null = null;
let cachedCertPem: string | null = null;

function isLightColor(hex?: string): boolean {
  if (!hex || hex === 'transparent') return false;
  const clean = hex.replace('#', '').trim();
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) || 0;
    g = parseInt(clean.slice(2, 4), 16) || 0;
    b = parseInt(clean.slice(4, 6), 16) || 0;
  } else {
    return false;
  }
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

function normalizeTargetUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return 'https://example.com';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getDebugKeystore(): { privateKey: string; certificate: string } {
  if (cachedKeyPem && cachedCertPem) {
    return { privateKey: cachedKeyPem, certificate: cachedCertPem };
  }

  // Generate 2048-bit RSA key pair in PKCS#8 format (strictly required by apk_sign_ts)
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const forgePrivKey = forge.pki.privateKeyFromPem(privateKey);
  const forgePubKey = forge.pki.publicKeyFromPem(publicKey);

  const cert = forge.pki.createCertificate();
  cert.publicKey = forgePubKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 25);

  const attrs = [
    { name: 'commonName', value: 'Android Debug' },
    { name: 'organizationName', value: 'Bapp Platform' },
    { name: 'countryName', value: 'US' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(forgePrivKey, forge.md.sha256.create());

  const certPem = forge.pki.certificateToPem(cert);
  cachedKeyPem = privateKey;
  cachedCertPem = certPem;

  return { privateKey, certificate: certPem };
}

/**
 * Resolves a high-quality 512x512 PNG icon buffer and data URI from user config, remote URL, or monogram.
 */
async function resolveAppIconBuffer(
  config: ProjectConfig,
  appName: string
): Promise<{ buffer: Buffer; dataUri: string; isCustom: boolean }> {
  const themeColor = config.themeColor || '#0A0A0A';
  const initialChar = (appName.trim().charAt(0) || 'B').toUpperCase();
  const textColor = isLightColor(themeColor) ? '#09090b' : '#ffffff';

  // 1. Check iconBase64
  if (config.iconBase64 && config.iconBase64.length > 50) {
    try {
      const cleanB64 = config.iconBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const rawBuf = Buffer.from(cleanB64, 'base64');
      const pngBuf = await sharp(rawBuf)
        .resize(512, 512, { fit: 'cover' })
        .png({ compressionLevel: 9 })
        .toBuffer();
      return {
        buffer: pngBuf,
        dataUri: `data:image/png;base64,${pngBuf.toString('base64')}`,
        isCustom: true,
      };
    } catch (e) {
      console.warn('Failed to parse iconBase64:', e);
    }
  }

  // 2. Check iconUrl with data:image/
  if (config.iconUrl && config.iconUrl.startsWith('data:image/')) {
    try {
      const cleanB64 = config.iconUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const rawBuf = Buffer.from(cleanB64, 'base64');
      const pngBuf = await sharp(rawBuf)
        .resize(512, 512, { fit: 'cover' })
        .png({ compressionLevel: 9 })
        .toBuffer();
      return {
        buffer: pngBuf,
        dataUri: `data:image/png;base64,${pngBuf.toString('base64')}`,
        isCustom: true,
      };
    } catch (e) {
      console.warn('Failed to parse data:image iconUrl:', e);
    }
  }

  // 3. Check iconUrl with http:// or https:// (e.g. from website favicon/apple-touch-icon)
  if (config.iconUrl && (config.iconUrl.startsWith('http://') || config.iconUrl.startsWith('https://'))) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(config.iconUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Bapp/1.0',
          'Accept': 'image/*,*/*',
        },
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        const rawBuf = Buffer.from(arrayBuf);
        if (rawBuf.length > 20) {
          const pngBuf = await sharp(rawBuf)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png({ compressionLevel: 9 })
            .toBuffer();
          return {
            buffer: pngBuf,
            dataUri: `data:image/png;base64,${pngBuf.toString('base64')}`,
            isCustom: true,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch remote iconUrl:', config.iconUrl, e);
    }
  }

  // Fallback to high-resolution monogram
  const fallbackSvg = generateFallbackMonogramSvg(themeColor, initialChar, textColor);
  const fallbackPng = await sharp(fallbackSvg)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  return {
    buffer: fallbackPng,
    dataUri: `data:image/png;base64,${fallbackPng.toString('base64')}`,
    isCustom: false,
  };
}

/**
 * Generate high-definition square and round Android launcher icon PNG buffers for all standard densities.
 */
async function generateLauncherIcons(sourceBuffer: Buffer): Promise<Record<string, string>> {
  // Define density maps to match Android WebView Base APK exact resource slots
  // ic_launcher (square/squircle) & ic_launcher_round (circle)
  const densitySpecs = [
    { size: 48, squarePath: 'res/9w.png', roundPath: 'res/zR.png' },   // mdpi
    { size: 72, squarePath: 'res/yn.png', roundPath: 'res/8c.png' },   // hdpi
    { size: 96, squarePath: 'res/FS.png', roundPath: 'res/wb.png' },   // xhdpi
    { size: 144, squarePath: 'res/RJ.png', roundPath: 'res/fO.png' },  // xxhdpi
    { size: 192, squarePath: 'res/o-.png', roundPath: 'res/Gc.png' },  // xxxhdpi
  ];

  const result: Record<string, string> = {};

  for (const spec of densitySpecs) {
    // 1. Generate square icon PNG
    const squarePng = await sharp(sourceBuffer)
      .resize(spec.size, spec.size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    result[spec.squarePath] = squarePng.toString('base64');

    // 2. Generate circular round icon PNG
    const half = spec.size / 2;
    const circleMask = Buffer.from(
      `<svg width="${spec.size}" height="${spec.size}"><circle cx="${half}" cy="${half}" r="${half}" fill="#ffffff"/></svg>`
    );

    const roundPng = await sharp(squarePng)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    result[spec.roundPath] = roundPng.toString('base64');
  }

  return result;
}

function generateFallbackMonogramSvg(themeColor: string, initialChar: string, textColor: string): Buffer {
  return Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.30"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="${themeColor}"/>
      <rect width="512" height="512" rx="120" fill="url(#grad)"/>
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle"
            fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            font-weight="800" font-size="260" letter-spacing="-0.02em">
        ${initialChar}
      </text>
    </svg>
  `);
}

/**
 * Generate a complete, signed, real Android APK package (.apk)
 * with 100% compliant DEX bytecode, exact 4-byte zip alignment, and v1/v2/v3 signatures.
 */
export async function generateRealApk(project: Project): Promise<{ apkBuffer: Buffer; fileName: string }> {
  const config = project.config;
  const appName = config.appName || project.name || 'Bapp App';
  const targetUrl = normalizeTargetUrl(project.websiteUrl || 'https://example.com');
  const safeBaseName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'app';
  const fileName = `${safeBaseName}-debug.apk`;

  // Look for precompiled base template APK across possible paths
  const possiblePaths = [
    path.resolve(process.cwd(), 'server/templates/webview-base.apk'),
    path.resolve(process.cwd(), 'dist/server/templates/webview-base.apk'),
    '/app/applet/server/templates/webview-base.apk',
  ];
  const templatePath = possiblePaths.find((p) => fs.existsSync(p));

  if (!templatePath) {
    throw new Error('Base APK template not found in server/templates/webview-base.apk');
  }

  // Packer python script path
  const possibleScriptPaths = [
    path.resolve(process.cwd(), 'server/generators/apkPacker.py'),
    path.resolve(process.cwd(), 'dist/server/generators/apkPacker.py'),
    '/app/applet/server/generators/apkPacker.py',
  ];
  const packerScriptPath = possibleScriptPaths.find((p) => fs.existsSync(p));
  if (!packerScriptPath) {
    throw new Error('APK Packer script not found at server/generators/apkPacker.py');
  }

  // Create temporary file path for aligned unsigned APK and icons map
  const tempUnsignedApk = path.join(
    os.tmpdir(),
    `bapp-unsigned-${Date.now()}-${Math.random().toString(36).slice(2)}.apk`
  );
  const tempIconsJson = path.join(
    os.tmpdir(),
    `bapp-icons-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );

  let unsignedApkBuffer: Buffer;

  try {
    const packageId = config.packageId || config.bundleId || 'com.bapp.app';
    const themeColor = config.themeColor || '#0A0A0A';
    const bgColor = config.splashBackgroundColor || config.themeColor || '#0A0A0A';
    // Resolve source icon (handles base64, data URI, remote http/https icon, or fallback monogram)
    const iconResult = await resolveAppIconBuffer(config, appName);

    const rawConfigJson = JSON.stringify({
      packageId: packageId,
      bundleId: packageId,
      appName: appName,
      websiteUrl: targetUrl,
      themeColor: themeColor,
      splashBackgroundColor: bgColor,
      iconDataUri: iconResult.dataUri,
      isCustomIcon: iconResult.isCustom,
      pullToRefresh: Boolean(config.pullToRefresh),
      enableCamera: Boolean(config.enableCamera),
      enableLocation: Boolean(config.enableLocation),
      enableNotifications: Boolean(config.enableNotifications),
      bottomNavigation: Boolean(config.bottomNavigation),
      versionCode: config.versionCode || 1,
      versionName: config.versionName || '1.0.0',
    });

    // Generate crisp multi-density launcher icons
    const iconsMap = await generateLauncherIcons(iconResult.buffer);
    fs.writeFileSync(tempIconsJson, JSON.stringify(iconsMap));

    // Execute python packer to produce 4-byte aligned, DEX-patched, AXML-patched APK with custom icons
    try {
      execFileSync('python3', [
        packerScriptPath,
        templatePath,
        tempUnsignedApk,
        appName,
        targetUrl,
        themeColor,
        bgColor,
        rawConfigJson,
        packageId,
        tempIconsJson,
      ], { stdio: 'pipe' });
    } catch (error: unknown) {
      const processError = error as { stderr?: Buffer | string };
      const details = processError.stderr?.toString().trim();
      throw new Error(`APK packaging failed${details ? `: ${details}` : '.'}`);
    }

    if (!fs.existsSync(tempUnsignedApk)) {
      throw new Error('APK packer failed to write output file');
    }

    unsignedApkBuffer = fs.readFileSync(tempUnsignedApk);
  } finally {
    if (fs.existsSync(tempUnsignedApk)) {
      try {
        fs.unlinkSync(tempUnsignedApk);
      } catch {
        // Ignore cleanup error
      }
    }
    if (fs.existsSync(tempIconsJson)) {
      try {
        fs.unlinkSync(tempIconsJson);
      } catch {
        // Ignore cleanup error
      }
    }
  }

  // Sign the APK using APK Signature Scheme v1, v2, and v3
  const { privateKey, certificate } = getDebugKeystore();
  const signResult = await signApk(unsignedApkBuffer, privateKey, certificate);
  const signedApkBuffer = Buffer.from(signResult.signedApk);

  return {
    apkBuffer: signedApkBuffer,
    fileName,
  };
}
