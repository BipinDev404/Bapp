import assert from 'node:assert/strict';
import { test } from 'node:test';
import JSZip from 'jszip';
import { analyzeWebsite } from './analyzer';
import { generateAndroidProjectZip } from './generators/android';
import type { Project } from '../src/types';

const fixtures = [
  ['static website', '<meta name="viewport" content="width=device-width"><h1>Static</h1>', 'responsive'],
  ['React application', '<script src="/assets/react.js"></script><script>localStorage.setItem("x", "1")</script>', 'localStorage'],
  ['login application', '<a href="https://accounts.google.com/o/oauth2/auth">Login</a>', 'oauth'],
  ['file upload application', '<input type="file" multiple>', 'fileUpload'],
  ['camera application', '<script>navigator.mediaDevices.getUserMedia({video:true})</script>', 'camera'],
  ['location application', '<script>navigator.geolocation.getCurrentPosition(done)</script>', 'location'],
  ['download application', '<a download="report.pdf" href="/report.pdf">Download</a>', 'fileDownload'],
  ['PWA', '<link rel="manifest" href="/manifest.json"><script>navigator.serviceWorker.register("/sw.js")</script>', 'pwa'],
  ['WebSocket application', '<script>new WebSocket("wss://socket.example.test")</script>', 'websocket'],
  ['OAuth application', '<script>window.open("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")</script>', 'oauth'],
] as const;

test('analyzes representative website requirements without rejecting detections', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [name, html, expected] of fixtures) {
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const value = String(input);
        if (value.includes('favicon') || value.includes('google.com/s2') || value.includes('duckduckgo.com')) {
          return new Response('not-an-image', { status: 200 });
        }
        return new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }) as typeof fetch;

      const analysis = await analyzeWebsite('https://example.com');
      assert.equal(analysis.status, 200, name);
      if (expected === 'responsive') assert.equal(analysis.isResponsive, true, name);
      if (expected === 'pwa') assert.equal(analysis.isPwa, true, name);
      if (expected !== 'responsive' && expected !== 'pwa') {
        assert.equal(analysis.detectedFeatures[expected as keyof typeof analysis.detectedFeatures], true, name);
      }
      assert.ok(analysis.compatibility.score >= 0 && analysis.compatibility.score <= 100, name);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generated Android project contains gated native bridge handlers', async () => {
  const project = {
    id: 'test', userId: 'test', name: 'Bridge Test', websiteUrl: 'https://example.com', targetPlatform: 'android',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    config: {
      appName: 'Bridge Test', packageId: 'com.example.bridge', bundleId: 'com.example.bridge', versionName: '1.0.0', versionCode: 1,
      themeColor: '#000000', backgroundColor: '#FFFFFF', orientation: 'portrait', pullToRefresh: true, swipeNavigation: true,
      bottomNavigation: false, backButtonBehavior: 'history', externalLinksBehavior: 'external_browser', allowedDomains: ['example.com'],
      enableCamera: true, cameraPermissionReason: 'Camera', enableMicrophone: true, enableLocation: true,
      locationPermissionReason: 'Location', enableFileUpload: true, enableDownloads: true, enablePopups: true,
      popupBehavior: 'external_browser', enableNotifications: false, splashBackgroundColor: '#000000', enableDomStorage: true,
      enableJavaScript: true, clearCacheOnExit: false,
    },
  } satisfies Project;
  const { zipBuffer } = await generateAndroidProjectZip(project);
  const archive = await JSZip.loadAsync(zipBuffer);
  const text = await archive.file('app/src/main/java/com/example/bridge/MainActivity.kt')!.async('text');
  assert.match(text, /onPermissionRequest/);
  assert.match(text, /setDownloadListener/);
  assert.match(text, /onShowFileChooser/);
  assert.match(text, /onGeolocationPermissionsShowPrompt/);
});
