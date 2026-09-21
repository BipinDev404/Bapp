export type Platform = 'android' | 'ios' | 'both';

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
    location: boolean;
    fileUpload: boolean;
    audio: boolean;
    video: boolean;
  };
  compatibility: {
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
  enableNotifications: boolean;
  
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
