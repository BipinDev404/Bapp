import sharp from 'sharp';
import { validateWebsiteUrl } from './security';
import type { CompatibilityFeature, WebsiteAnalysis } from '../src/types';

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

  const headerValue = (name: string) => response.headers.get(name) || undefined;
  const scriptText = html.replace(/<[^>]+>/g, ' ');
  const detect = (pattern: RegExp) => pattern.test(`${html} ${scriptText}`);
  const featureUrls = [...html.matchAll(/(?:src|href|action|url)=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .map((candidate) => { try { return new URL(candidate, finalUrl); } catch { return null; } })
    .filter((candidate): candidate is URL => Boolean(candidate));
  const primaryHost = new URL(finalUrl).hostname;
  const externalDomains = [...new Set(featureUrls.map((candidate) => candidate.hostname).filter((host) => host && host !== primaryHost && !host.endsWith(`.${primaryHost}`)))];
  const permissions = [...new Set([...html.matchAll(/(?:Permissions-Policy|allow)=["']([^"']+)["']/gi)].flatMap((match) => match[1].split(/[;, ]+/).filter(Boolean)))];
  const browserApis = ['Web Bluetooth', 'Web Share', 'Web NFC', 'Payment Request', 'Web Locks'].filter((name) => ({
    'Web Bluetooth': detect(/bluetooth|getAvailability/i),
    'Web Share': detect(/navigator\.share/i),
    'Web NFC': detect(/NDEFReader|nfc/i),
    'Payment Request': detect(/PaymentRequest/i),
    'Web Locks': detect(/navigator\.locks/i),
  }[name]));
  const detectedFeatures = {
    camera: detect(/getUserMedia|mediaDevices|capture=["'](?:user|environment)["']/i),
    microphone: detect(/getUserMedia|audio:\s*true|microphone/i),
    location: detect(/geolocation\.(?:getCurrentPosition|watchPosition)/i),
    fileUpload: detect(/<input[^>]+type=["']file["']/i),
    fileDownload: detect(/download=["']|application\/(?:pdf|zip)|Content-Disposition|Blob\(|URL\.createObjectURL/i),
    notifications: detect(/Notification|PushManager|serviceWorker\.ready/i),
    popups: detect(/target=["']_blank|window\.open|noopener/i),
    oauth: detect(/oauth|openid|authorize|accounts\.google|login\.microsoftonline|facebook\.com\/dialog|appleid\.apple/i),
    payments: detect(/stripe|paypal|braintree|adyen|checkout|PaymentRequest/i),
    websocket: detect(/WebSocket|wss?:\/\//i),
    webrtc: detect(/RTCPeerConnection|RTCSessionDescription|WebRTC/i),
    externalDomains,
    deepLinks: detect(/intent:\/\/|[a-z][a-z0-9+.-]{2,}:\/\/|universal.?link|app.?link/i),
    browserApis,
    localStorage: detect(/localStorage|sessionStorage/i),
    cookies: Boolean(response.headers.get('set-cookie')) || detect(/document\.cookie/i),
    indexedDb: detect(/indexedDB|IDBDatabase/i),
    fullscreen: detect(/requestFullscreen|webkitEnterFullscreen/i),
    clipboard: detect(/clipboard(?:\.write|\.read|Data)/i),
    audio: detect(/<audio|AudioContext|webkitAudioContext/i),
    video: detect(/<video|MediaSource/i),
    permissions,
    iframes: detect(/<iframe/i),
    contentSecurityPolicy: headerValue('content-security-policy'),
    xFrameOptions: headerValue('x-frame-options'),
    antiAutomation: detect(/captcha|recaptcha|hcaptcha|turnstile|navigator\.webdriver|bot.?detect|anti.?bot/i),
  };

  const deductions: string[] = [];
  const recommendations: string[] = [];
  const addDeduction = (condition: boolean, message: string, recommendation: string) => {
    if (condition) {
      deductions.push(message);
      recommendations.push(recommendation);
    }
  };
  addDeduction(!isHttps, 'HTTPS is not enabled', 'Enable HTTPS before publishing; cleartext is restricted on modern mobile platforms.');
  addDeduction(!isResponsive, 'Responsive viewport was not detected', 'Add a mobile viewport and verify layout at phone widths.');
  addDeduction(finalUrl !== url, 'The website redirects to another URL', 'Review the final host and include trusted redirect domains.');
  addDeduction(detectedFeatures.camera, 'Camera requires native permission', 'Enable camera access in project configuration.');
  addDeduction(detectedFeatures.microphone, 'Microphone requires native permission', 'Enable microphone access in project configuration.');
  addDeduction(detectedFeatures.location, 'Location requires native permission', 'Enable location access in project configuration.');
  addDeduction(detectedFeatures.fileUpload, 'File chooser handling is required', 'Enable file uploads to provide camera, gallery, and document picking.');
  addDeduction(detectedFeatures.fileDownload, 'Download handling is required', 'Enable native downloads; files will not be executed automatically.');
  addDeduction(detectedFeatures.oauth, 'External authentication detected', 'Use an external browser and an app link for providers that reject embedded login.');
  addDeduction(detectedFeatures.payments, 'External payment flow detected', 'Use the provider-supported browser flow and return via a deep link.');
  addDeduction(detectedFeatures.popups, 'Popup or new-window handling is required', 'Choose a popup policy during configuration.');
  addDeduction(detectedFeatures.antiAutomation, 'Bot or anti-automation checks detected', 'Test authentication and challenge flows on a real device.');
  addDeduction(Boolean(detectedFeatures.xFrameOptions || detectedFeatures.contentSecurityPolicy?.includes('frame-ancestors')), 'Embedding restrictions were detected', 'The generated app navigates the site directly; do not rely on iframe embedding.');
  if (isPwa) recommendations.push('PWA detected; test service-worker caching separately because WebView behavior can differ from Chrome.');

  const booleanFeatureNames = ['camera', 'microphone', 'location', 'fileUpload', 'fileDownload', 'notifications', 'popups', 'oauth', 'payments', 'websocket', 'webrtc', 'localStorage', 'cookies', 'indexedDb', 'fullscreen', 'clipboard', 'audio', 'video', 'iframes', 'antiAutomation'] as const;
  const features: Record<string, CompatibilityFeature> = Object.fromEntries(booleanFeatureNames.map((name) => [name, {
    detected: detectedFeatures[name],
    status: !detectedFeatures[name] ? 'compatible' : ['camera', 'microphone', 'location', 'fileUpload', 'fileDownload', 'notifications', 'popups', 'fullscreen', 'clipboard'].includes(name) ? 'native_required' : ['oauth', 'payments'].includes(name) ? 'browser_required' : 'compatible',
    recommendation: deductions.find((item) => item.toLowerCase().includes(name.toLowerCase())),
  }])) as Record<string, CompatibilityFeature>;
  const score = Math.max(0, 100 - deductions.length * 5);
  const overall = score >= 85 ? 'good' : score >= 60 ? 'needs_configuration' : 'limited';
  const issues = [...deductions];

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
      score,
      overall,
      features,
      deductions,
      webViewScore,
      responsiveScore,
      httpsScore,
      issues,
      recommendations,
    },
    analyzedAt: new Date().toISOString(),
  };
}
