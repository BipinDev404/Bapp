/**
 * Downloads a build artifact reliably within iframe-sandboxed environments.
 * Prevents Google Cloud Run/AI Studio iframe navigation interception (__cookie_check.html).
 */
export async function downloadArtifactSafe(
  downloadUrl: string,
  suggestedFileName: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ success: boolean; fileName: string }> {
  try {
    onStatusUpdate?.('Requesting file...');

    // Attempt direct fetch first
    const response = await fetch(downloadUrl, {
      credentials: 'same-origin',
    });

    const contentType = response.headers.get('content-type') || '';

    // Check if the response was intercepted by a cookie gate or login HTML (e.g. __cookie_check.html)
    const isHtmlInterception =
      contentType.includes('text/html') ||
      contentType.includes('application/xhtml+xml');

    if (isHtmlInterception) {
      onStatusUpdate?.('Unpacking package via secure stream...');
      // Fallback: Fetch base64 payload to bypass iframe cookie navigation gates
      const base64Url = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}format=base64`;
      const jsonRes = await fetch(base64Url, { credentials: 'same-origin' });
      
      if (!jsonRes.ok) {
        throw new Error(`Failed to download artifact: HTTP ${jsonRes.status}`);
      }

      const data = await jsonRes.json();
      if (!data.base64) {
        throw new Error('Invalid artifact payload received');
      }

      const binaryStr = window.atob(data.base64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const realFileName = data.fileName || suggestedFileName;
      const blob = new Blob([bytes], {
        type: data.contentType || 'application/vnd.android.package-archive',
      });

      triggerBlobDownload(blob, realFileName);
      onStatusUpdate?.('Download started');
      return { success: true, fileName: realFileName };
    }

    // Direct fetch succeeded with binary
    onStatusUpdate?.('Preparing download...');
    const blob = await response.blob();

    // Secondary sanity check: ensure blob doesn't contain HTML error payload
    if (blob.type.includes('text/html') || blob.size < 2000) {
      const sample = await blob.slice(0, 100).text();
      if (sample.includes('<!DOCTYPE') || sample.includes('<html') || sample.includes('cookie_check')) {
        // Interception detected, use base64 fallback
        onStatusUpdate?.('Unpacking package stream...');
        const base64Url = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}format=base64`;
        const jsonRes = await fetch(base64Url, { credentials: 'same-origin' });
        const data = await jsonRes.json();
        if (data.base64) {
          const binaryStr = window.atob(data.base64);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const realFileName = data.fileName || suggestedFileName;
          const realBlob = new Blob([bytes], {
            type: data.contentType || 'application/vnd.android.package-archive',
          });
          triggerBlobDownload(realBlob, realFileName);
          onStatusUpdate?.('Download started');
          return { success: true, fileName: realFileName };
        }
      }
    }

    // Extract filename from Content-Disposition if present
    const disposition = response.headers.get('content-disposition');
    let resolvedFileName = suggestedFileName;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        resolvedFileName = match[1].trim();
      }
    }

    triggerBlobDownload(blob, resolvedFileName);
    onStatusUpdate?.('Download complete');
    return { success: true, fileName: resolvedFileName };
  } catch (err: unknown) {
    console.warn('In-memory blob download failed, falling back to direct tab open:', err);
    // Ultimate fallback: open in fresh tab without download attribute so browser can authenticate
    window.open(downloadUrl, '_blank');
    return { success: true, fileName: suggestedFileName };
  }
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      /* ignore cleanup error */
    }
  }, 1000);
}
