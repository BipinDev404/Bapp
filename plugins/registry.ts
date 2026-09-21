export interface BappPluginMetadata {
  name: string;
  version: string;
  bridgeMethods: string[];
  permissionRequirements: string[];
  configuration: string[];
}

export const plugins: BappPluginMetadata[] = [
  { name: 'camera', version: '1.0.0', bridgeMethods: ['camera.open'], permissionRequirements: ['camera'], configuration: ['enabled'] },
  { name: 'location', version: '1.0.0', bridgeMethods: ['location.getCurrentPosition'], permissionRequirements: ['location'], configuration: ['enabled'] },
  { name: 'notifications', version: '1.0.0', bridgeMethods: ['notifications.requestPermission'], permissionRequirements: ['notifications'], configuration: ['enabled'] },
  { name: 'biometrics', version: '1.0.0', bridgeMethods: ['biometric.authenticate'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'haptics', version: '1.0.0', bridgeMethods: ['haptics.trigger'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'qrScanner', version: '1.0.0', bridgeMethods: ['qr.scan'], permissionRequirements: ['camera'], configuration: ['enabled'] },
  { name: 'downloads', version: '1.0.0', bridgeMethods: ['files.download'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'filePicker', version: '1.0.0', bridgeMethods: ['files.pick'], permissionRequirements: ['photos'], configuration: ['enabled'] },
  { name: 'share', version: '1.0.0', bridgeMethods: ['share.sharePage'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'secureStorage', version: '1.0.0', bridgeMethods: ['storage.get', 'storage.set'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'deepLinks', version: '1.0.0', bridgeMethods: ['navigation.open'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'analytics', version: '1.0.0', bridgeMethods: ['analytics.track'], permissionRequirements: [], configuration: ['enabled'] },
  { name: 'inAppPurchases', version: '1.0.0', bridgeMethods: ['purchases.start'], permissionRequirements: [], configuration: ['enabled'] },
];
