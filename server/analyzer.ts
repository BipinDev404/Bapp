import sharp from 'sharp';
import { validateWebsiteUrl } from './security';
import type { WebsiteAnalysis } from '../src/types';

export async function analyzeWebsite(targetUrl: string): Promise<WebsiteAnalysis> {
  const validation = await validateWebsiteUrl(targetUrl);
  if (!validation.valid || !validation.sanitizedUrl) {
    throw new Error(validation.error || 'Invalid or prohibited website URL');
  }

  const url = validation.sanitizedUrl;
  const isHttps = url.startsWith('https://');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 BappAnalyzer/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('abort')) {
      throw new Error('Website connection timed out after 8 seconds.');
    }
    throw new Error(`Failed to connect to website: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const finalUrl = response.url || url;
  const status = response.status;
  const contentType = response.headers.get('content-type') || '';

  let html = '';
  try {
    // Read up to 2MB max
    const reader = response.body?.getReader();
    if (reader) {
      let received = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          received += value.length;
          chunks.push(value);
          if (received > 2 * 1024 * 1024) break; // limit to 2MB
        }
      }
      const combined = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      html = new TextDecoder('utf-8').decode(combined);
    } else {
      html = await response.text();
    }
  } catch {
    html = '';
  }

  // Extract metadata using regex parsers
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : '';
  if (!title) {
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    title = ogTitle ? ogTitle[1].trim() : new URL(finalUrl).hostname;
  }

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Favicon & Icon detection with multiple strategies
  let faviconUrl = '';
  const appleIcon = html.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i);
  const highResIcon = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+sizes=["'](?:192x192|512x512|256x256|180x180|128x128|96x96)["'][^>]+href=["']([^"']+)["']/i) ||
                     html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]+sizes=["'](?:192x192|512x512|256x256|180x180|128x128|96x96)["']/i);
  const iconMatch = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i);
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

  const candidateUrls: string[] = [];
  if (appleIcon) candidateUrls.push(appleIcon[1]);
  if (highResIcon) candidateUrls.push(highResIcon[1]);
  if (iconMatch) candidateUrls.push(iconMatch[1]);
  if (ogImage) candidateUrls.push(ogImage[1]);
  candidateUrls.push('/favicon.ico');

  // Also include Google High-Res Favicon CDN as fallback
  try {
    const host = new URL(finalUrl).hostname;
    candidateUrls.push(`https://www.google.com/s2/favicons?domain=${host}&sz=256`);
    candidateUrls.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
  } catch {
    // Ignore URL parse error
  }

  // Attempt to fetch and convert the best available favicon to base64
  let faviconBase64: string | undefined;
  for (const candidate of candidateUrls) {
    let resolvedUrl = '';
    try {
      resolvedUrl = new URL(candidate, finalUrl).toString();
    } catch {
      continue;
    }

    if (!faviconUrl) {
      faviconUrl = resolvedUrl;
    }

    try {
      const favController = new AbortController();
      const favTimeout = setTimeout(() => favController.abort(), 3500);
      const favRes = await fetch(resolvedUrl, {
        signal: favController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Bapp/1.0',
          'Accept': 'image/*,*/*',
        },
      });
      clearTimeout(favTimeout);

      if (favRes.ok) {
        const arrayBuf = await favRes.arrayBuffer();
        const favBuf = Buffer.from(arrayBuf);
        if (favBuf.length > 50) {
          const pngBuf = await sharp(favBuf)
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png({ compressionLevel: 9 })
            .toBuffer();
          faviconBase64 = `data:image/png;base64,${pngBuf.toString('base64')}`;
          faviconUrl = resolvedUrl;
          break; // Successfully obtained high-res icon
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (!faviconUrl) {
    try {
      faviconUrl = `${new URL(finalUrl).origin}/favicon.ico`;
    } catch {
      faviconUrl = '';
    }
  }

  // Viewport detection
  const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']+)["']/i);
  const hasViewport = Boolean(viewportMatch);
  const isResponsive = hasViewport && (viewportMatch?.[1].includes('width=device-width') ?? false);

  // Manifest & PWA
  const manifestMatch = html.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i);
  const hasManifest = Boolean(manifestMatch);
  let manifestUrl: string | undefined;
  if (manifestMatch) {
    try {
      manifestUrl = new URL(manifestMatch[1], finalUrl).toString();
    } catch {
      manifestUrl = undefined;
    }
  }

  const hasServiceWorker = /serviceWorker\.register|navigator\.serviceWorker/i.test(html);
  const isPwa = hasManifest && hasServiceWorker;

  // Theme color
  const themeMatch = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  const themeColor = themeMatch ? themeMatch[1].trim() : undefined;

  // Feature detection
  const detectedFeatures = {
    camera: /getUserMedia|capture=["']user["']|capture=["']environment["']/i.test(html),
    location: /geolocation\.getCurrentPosition|watchPosition/i.test(html),
    fileUpload: /<input[^>]+type=["']file["']/i.test(html),
    audio: /<audio|AudioContext|webkitAudioContext/i.test(html),
    video: /<video/i.test(html),
  };

  // Compatibility assessment
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!isHttps) {
    issues.push('Website is using unencrypted HTTP. Android and iOS require HTTPS by default.');
    recommendations.push('Configure an SSL certificate or enable cleartext traffic in project configuration.');
  }

  if (!isResponsive) {
    issues.push('No mobile-optimized responsive viewport meta tag detected.');
    recommendations.push('Ensure the web layout scales well on mobile screens.');
  }

  if (detectedFeatures.camera) {
    recommendations.push('Camera API detected. Ensure Camera permissions are enabled in step 3.');
  }

  if (detectedFeatures.fileUpload) {
    recommendations.push('File upload inputs detected. Bapp will include native WebChromeClient file pickers.');
  }

  if (isPwa) {
    recommendations.push('PWA detected. Offline caching and manifest assets will be supported.');
  }

  const webViewScore: 'excellent' | 'good' | 'fair' | 'poor' =
    isHttps && isResponsive ? 'excellent' : isHttps ? 'good' : 'fair';

  const responsiveScore: 'excellent' | 'good' | 'fair' =
    isResponsive ? 'excellent' : 'fair';

  const httpsScore: 'secure' | 'insecure' = isHttps ? 'secure' : 'insecure';

  return {
    url,
    finalUrl,
    isHttps,
    status,
    title,
    description,
    faviconUrl,
    faviconBase64,
    hasViewport,
    isResponsive,
    hasManifest,
    manifestUrl,
    hasServiceWorker,
    isPwa,
    themeColor,
    detectedFeatures,
    compatibility: {
      webViewScore,
      responsiveScore,
      httpsScore,
      issues,
      recommendations,
    },
    analyzedAt: new Date().toISOString(),
  };
}
