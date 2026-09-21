import type { NativePluginName, Project, ShellConfig } from '../src/types';

const pluginNames: NativePluginName[] = [
  'camera', 'location', 'notifications', 'biometrics', 'haptics', 'qrScanner',
  'downloads', 'filePicker', 'share', 'secureStorage', 'deepLinks', 'analytics', 'inAppPurchases',
];

function safeSnippet(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.replace(/<\/script/gi, '<\\/script').slice(0, maxLength);
}

export function createShellConfig(project: Project): ShellConfig {
  const config = project.config;
  const primaryDomain = new URL(project.websiteUrl).hostname;
  const detected = project.analysis?.detectedFeatures;
  const configured = config.plugins || {};
  const enabled: Record<NativePluginName, boolean> = {
    camera: config.enableCamera || Boolean(detected?.camera),
    location: config.enableLocation || Boolean(detected?.location),
    notifications: config.enableNotifications || Boolean(detected?.notifications),
    biometrics: Boolean(config.plugins?.biometrics?.enabled),
    haptics: Boolean(config.plugins?.haptics?.enabled),
    qrScanner: Boolean(config.plugins?.qrScanner?.enabled),
    downloads: config.enableDownloads || Boolean(detected?.fileDownload),
    filePicker: config.enableFileUpload || Boolean(detected?.fileUpload),
    share: Boolean(config.plugins?.share?.enabled),
    secureStorage: Boolean(config.plugins?.secureStorage?.enabled),
    deepLinks: Boolean(config.plugins?.deepLinks?.enabled) || Boolean(detected?.deepLinks),
    analytics: Boolean(config.plugins?.analytics?.enabled),
    inAppPurchases: Boolean(config.plugins?.inAppPurchases?.enabled),
  };

  return {
    schemaVersion: 1,
    website: project.websiteUrl,
    appName: config.appName || project.name,
    packageId: config.packageId,
    bundleId: config.bundleId,
    versionName: config.versionName,
    versionCode: config.versionCode,
    bridgeVersion: '1.0.0',
    plugins: Object.fromEntries(pluginNames.map((name) => [name, {
      enabled: enabled[name],
      options: configured[name]?.options,
    }])) as ShellConfig['plugins'],
    navigation: {
      topBar: config.navigation?.topBar ?? false,
      bottomTabs: config.navigation?.bottomTabs ?? config.bottomNavigation,
      sidebar: config.navigation?.sidebar ?? false,
      backButton: config.navigation?.backButton ?? config.backButtonBehavior,
      primaryDomain,
      allowedDomains: [...new Set([primaryDomain, ...(config.allowedDomains || []), ...(config.navigation?.allowedDomains || [])])],
      externalLinks: config.navigation?.externalLinks ?? config.externalLinksBehavior,
    },
    customJavaScript: safeSnippet(config.customJavaScript, 20_000),
    customCss: config.customCss?.replace(/<\/style/gi, '<\\/style').slice(0, 20_000),
  };
}

export function shellConfigJson(project: Project): string {
  return JSON.stringify(createShellConfig(project));
}
