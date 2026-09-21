export type Platform = 'android' | 'ios' | 'both';

export type CompatibilityStatus = 'compatible' | 'native_required' | 'browser_required' | 'not_supported';

export type NativePluginName =
  | 'camera'
  | 'location'
  | 'notifications'
  | 'biometrics'
  | 'haptics'
  | 'qrScanner'
  | 'downloads'
  | 'filePicker'
  | 'share'
  | 'secureStorage'
  | 'deepLinks'
  | 'analytics'
  | 'inAppPurchases';

export interface NativePluginConfig {
  enabled: boolean;
  options?: Record<string, string | number | boolean>;
}

export interface ShellNavigationConfig {
  topBar: boolean;
  bottomTabs: boolean;
  sidebar: boolean;
  backButton: 'history' | 'exit' | 'confirm';
  primaryDomain: string;
  allowedDomains: string[];
  externalLinks: 'in_app' | 'external_browser' | 'ask';
}

export interface ShellConfig {
  schemaVersion: 1;
  website: string;
  appName: string;
  packageId: string;
  bundleId: string;
  versionName: string;
  versionCode: number;
  bridgeVersion: string;
  plugins: Record<NativePluginName, NativePluginConfig>;
  navigation: ShellNavigationConfig;
  customJavaScript?: string;
  customCss?: string;
}

export interface CompatibilityFeature {
  detected: boolean;
  status: CompatibilityStatus;
  reason?: string;
  recommendation?: string;
}

export type BuildStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'ANALYZING'
  | 'GENERATING'
  | 'BUILDING'
  | 'SIGNING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface WebsiteAnalysis {
  url: string;
  finalUrl: string;
  isHttps: boolean;
  status: number;
  title: string;
  description: string;
  faviconUrl: string;
  faviconBase64?: string;
  hasViewport: boolean;
  isResponsive: boolean;
  hasManifest: boolean;
  manifestUrl?: string;
  hasServiceWorker: boolean;
  isPwa: boolean;
  themeColor?: string;
  detectedFeatures: {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    fileUpload: boolean;
    fileDownload: boolean;
    notifications: boolean;
    popups: boolean;
    oauth: boolean;
    payments: boolean;
    websocket: boolean;
    webrtc: boolean;
    externalDomains: string[];
    deepLinks: boolean;
    browserApis: string[];
    localStorage: boolean;
    cookies: boolean;
    indexedDb: boolean;
    fullscreen: boolean;
    clipboard: boolean;
    audio: boolean;
    video: boolean;
    permissions: string[];
    iframes: boolean;
    contentSecurityPolicy?: string;
    xFrameOptions?: string;
    antiAutomation: boolean;
  };
  compatibility: {
    score: number;
    overall: 'good' | 'needs_configuration' | 'limited';
    features: Record<string, CompatibilityFeature>;
    deductions: string[];
    webViewScore: 'excellent' | 'good' | 'fair' | 'poor';
    responsiveScore: 'excellent' | 'good' | 'fair';
    httpsScore: 'secure' | 'insecure';
    issues: string[];
    recommendations: string[];
  };
  analyzedAt: string;
}

export interface ProjectConfig {
  appName: string;
  packageId: string; // e.g. com.example.bappdemo
  bundleId: string;  // e.g. com.example.bappdemo
  versionName: string; // e.g. 1.0.0
  versionCode: number; // e.g. 1
  themeColor: string; // e.g. #0A0A0A or #F7F7F5
  backgroundColor: string;
  orientation: 'auto' | 'portrait' | 'landscape';
  
  // Navigation & Browser Controls
  pullToRefresh: boolean;
  swipeNavigation: boolean;
  bottomNavigation: boolean;
  backButtonBehavior: 'history' | 'exit' | 'confirm';
  externalLinksBehavior: 'in_app' | 'external_browser' | 'ask';
  allowedDomains: string[]; // Whitelist
  
  // Permissions & Capabilities
  enableCamera: boolean;
  cameraPermissionReason: string;
  enableLocation: boolean;
  locationPermissionReason: string;
  enableFileUpload: boolean;
  enableMicrophone: boolean;
  enableDownloads: boolean;
  enablePopups: boolean;
  enableNotifications: boolean;
  popupBehavior: 'in_app' | 'external_browser' | 'same_webview';
  
  // Splash & Assets
  iconBase64?: string;
  iconUrl?: string;
  splashScreenLogoUrl?: string;
  splashBackgroundColor: string;
  
  // Advanced WebView
  userAgentAppend?: string;
  enableDomStorage: boolean;
  enableJavaScript: boolean;
  clearCacheOnExit: boolean;
  plugins?: Partial<Record<NativePluginName, NativePluginConfig>>;
  navigation?: Partial<ShellNavigationConfig>;
  customJavaScript?: string;
  customCss?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  websiteUrl: string;
  config: ProjectConfig;
  analysis?: WebsiteAnalysis;
  targetPlatform: Platform;
  createdAt: string;
  updatedAt: string;
  lastBuildId?: string;
}

export interface BuildLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  step: string;
  message: string;
}

export interface BuildArtifact {
  id: string;
  buildId: string;
  projectId: string;
  type: 'android_project_zip' | 'ios_project_zip' | 'apk' | 'aab' | 'ipa' | 'mobileconfig' | 'all_zip';
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  checksum: string;
  createdAt: string;
  description: string;
}

export interface BuildJob {
  id: string;
  projectId: string;
  projectName: string;
  platform: Platform;
  status: BuildStatus;
  progress: number;
  currentStep: string;
  logs: BuildLog[];
  artifacts: BuildArtifact[];
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  workerId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'business';
  buildsUsedThisMonth: number;
  buildsLimit: number;
}
