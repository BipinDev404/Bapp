export type BappPlatform = 'android' | 'ios' | 'browser';

export interface BappDeviceInfo {
  platform: BappPlatform;
  version: string;
  model?: string;
  appVersion?: string;
}

export interface BappBridgeTransport {
  call<T>(method: string, args?: unknown): Promise<T>;
  on?(event: string, handler: (payload: unknown) => void): () => void;
}

const browserTransport: BappBridgeTransport = {
  async call<T>(method: string): Promise<T> {
    throw new Error(`${method} is unavailable outside the Bapp app`);
  },
};

function nativeTransport(): BappBridgeTransport | null {
  const candidate = (globalThis as { BappNative?: BappBridgeTransport }).BappNative;
  return candidate && typeof candidate.call === 'function' ? candidate : null;
}

export const Bapp = {
  isAvailable: () => Boolean(nativeTransport()),
  isApp: () => Boolean(nativeTransport()),
  platform: (): BappPlatform => nativeTransport() ? ((globalThis as { BappPlatform?: BappPlatform }).BappPlatform || 'browser') : 'browser',
  version: () => (globalThis as { BappVersion?: string }).BappVersion || '0.0.0',
  device: {
    getInfo: () => (nativeTransport() || browserTransport).call<BappDeviceInfo>('device.getInfo'),
  },
  navigation: {
    back: () => (nativeTransport() || browserTransport).call<void>('navigation.back'),
    close: () => (nativeTransport() || browserTransport).call<void>('navigation.close'),
    open: (url: string) => (nativeTransport() || browserTransport).call<void>('navigation.open', { url }),
  },
  share: {
    sharePage: (url?: string) => (nativeTransport() || browserTransport).call<void>('share.sharePage', { url }),
  },
  files: {
    download: (url: string, fileName?: string) => (nativeTransport() || browserTransport).call<void>('files.download', { url, fileName }),
    pick: (multiple = false) => (nativeTransport() || browserTransport).call<string[]>('files.pick', { multiple }),
  },
  camera: {
    open: () => (nativeTransport() || browserTransport).call<{ uri: string }>('camera.open'),
  },
  location: {
    getCurrentPosition: () => (nativeTransport() || browserTransport).call<{ latitude: number; longitude: number }>('location.getCurrentPosition'),
  },
  notifications: {
    requestPermission: () => (nativeTransport() || browserTransport).call<boolean>('notifications.requestPermission'),
  },
  haptics: {
    trigger: (style: 'light' | 'medium' | 'heavy' = 'light') => (nativeTransport() || browserTransport).call<void>('haptics.trigger', { style }),
  },
  storage: {
    get: <T = unknown>(key: string) => (nativeTransport() || browserTransport).call<T | null>('storage.get', { key }),
    set: (key: string, value: unknown) => (nativeTransport() || browserTransport).call<void>('storage.set', { key, value }),
  },
  biometric: {
    authenticate: (reason?: string) => (nativeTransport() || browserTransport).call<boolean>('biometric.authenticate', { reason }),
  },
};

export default Bapp;
