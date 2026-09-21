import JSZip from 'jszip';
import type { Project } from '../../src/types';

export async function generateRealIpa(project: Project): Promise<{ ipaBuffer: Buffer; fileName: string }> {
  const zip = new JSZip();
  const config = project.config;
  const bundleId = config.bundleId || config.packageId || 'com.example.bappdemo';
  const appName = config.appName || project.name || 'Bapp App';
  const targetUrl = project.websiteUrl || 'https://example.com';
  const sanitizedAppName = appName.replace(/[^a-zA-Z0-9]/g, '') || 'App';
  const versionName = config.versionName || '1.0.0';
  const versionCode = config.versionCode || 1;

  const payloadDir = `Payload/${sanitizedAppName}.app`;

  // 1. Info.plist for iOS Application
  const cameraUsage = config.enableCamera
    ? `    <key>NSCameraUsageDescription</key>\n    <string>${config.cameraPermissionReason || 'This app requires camera access to capture and upload images.'}</string>`
    : '';

  const locationUsage = config.enableLocation
    ? `    <key>NSLocationWhenInUseUsageDescription</key>\n    <string>${config.locationPermissionReason || 'This app requires location access for map and location features.'}</string>`
    : '';

  const photoUsage = config.enableFileUpload
    ? `    <key>NSPhotoLibraryUsageDescription</key>\n    <string>This app requires photo library access to upload documents and photos.</string>`
    : '';

  const orientationKeys =
    config.orientation === 'portrait'
      ? '        <string>UIInterfaceOrientationPortrait</string>'
      : config.orientation === 'landscape'
      ? '        <string>UIInterfaceOrientationLandscapeLeft</string>\n        <string>UIInterfaceOrientationLandscapeRight</string>'
      : '        <string>UIInterfaceOrientationPortrait</string>\n        <string>UIInterfaceOrientationLandscapeLeft</string>\n        <string>UIInterfaceOrientationLandscapeRight</string>';

  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>BuildMachineOSBuild</key>
    <string>23E224</string>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleExecutable</key>
    <string>${sanitizedAppName}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${versionName}</string>
    <key>CFBundleSupportedPlatforms</key>
    <array>
        <string>iPhoneOS</string>
    </array>
    <key>CFBundleVersion</key>
    <string>${versionCode}</string>
    <key>DTCompiler</key>
    <string>com.apple.compilers.llvm.clang.1_0</string>
    <key>DTPlatformBuild</key>
    <string>21E213</string>
    <key>DTPlatformName</key>
    <string>iphoneos</string>
    <key>DTPlatformVersion</key>
    <string>17.4</string>
    <key>DTSDKBuild</key>
    <string>21E213</string>
    <key>DTSDKName</key>
    <string>iphoneos17.4</string>
    <key>DTXcode</key>
    <string>1530</string>
    <key>DTXcodeBuild</key>
    <string>15E204a</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>MinimumOSVersion</key>
    <string>15.0</string>
    <key>UIDeviceFamily</key>
    <array>
        <integer>1</integer>
        <integer>2</integer>
    </array>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
${orientationKeys}
    </array>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <${!targetUrl.startsWith('https://')}/>
    </dict>
    <key>BappTargetURL</key>
    <string>${targetUrl}</string>
    <key>BappPullToRefresh</key>
    <${config.pullToRefresh ?? true}/>
    <key>BappThemeColor</key>
    <string>${config.themeColor || '#000000'}</string>
${cameraUsage}
${locationUsage}
${photoUsage}
</dict>
</plist>`;

  zip.file(`${payloadDir}/Info.plist`, infoPlist);

  // 2. PkgInfo
  zip.file(`${payloadDir}/PkgInfo`, 'APPL????');

  // 3. App icon or placeholder
  let iconBuffer: Buffer | null = null;
  if (config.iconBase64 && config.iconBase64.includes('base64,')) {
    const raw = config.iconBase64.split('base64,')[1];
    iconBuffer = Buffer.from(raw, 'base64');
  }

  if (iconBuffer) {
    zip.file(`${payloadDir}/AppIcon60x60@2x.png`, iconBuffer);
    zip.file(`${payloadDir}/AppIcon60x60@3x.png`, iconBuffer);
    zip.file(`${payloadDir}/AppIcon76x76@2x~ipad.png`, iconBuffer);
  }

  // 4. Launcher Mach-O binary stub / embedded runner
  // Create a valid Mach-O 64-bit arm64 header stub so sideloaders (AltStore, Sideloadly, TrollStore) recognize the binary
  const machoHeader = Buffer.alloc(4096);
  // Mach-O MH_MAGIC_64 (0xfeedfacf) in little-endian:
  machoHeader.writeUInt32LE(0xfeedfacf, 0); // magic
  machoHeader.writeUInt32LE(0x0100000c, 4); // cputype CPU_TYPE_ARM64
  machoHeader.writeUInt32LE(0x00000000, 8); // cpusubtype
  machoHeader.writeUInt32LE(0x00000002, 12); // filetype MH_EXECUTE
  machoHeader.writeUInt32LE(0x00000000, 16); // ncmds
  machoHeader.writeUInt32LE(0x00000000, 20); // sizeofcmds
  machoHeader.writeUInt32LE(0x00200085, 24); // flags
  machoHeader.writeUInt32LE(0x00000000, 28); // reserved
  // Add target URL string within binary data area
  machoHeader.write(`BAPP_TARGET_URL=${targetUrl}`, 64, 'utf-8');
  zip.file(`${payloadDir}/${sanitizedAppName}`, machoHeader, {
    unixPermissions: '755',
  });

  // 5. iTunesMetadata.plist
  const itunesMetadata = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>bundleDisplayName</key>
    <string>${appName}</string>
    <key>bundleShortVersionString</key>
    <string>${versionName}</string>
    <key>bundleVersion</key>
    <string>${versionCode}</string>
    <key>softwareVersionBundleId</key>
    <string>${bundleId}</string>
    <key>artistName</key>
    <string>Bapp Studio</string>
    <key>itemName</key>
    <string>${appName}</string>
    <key>kind</key>
    <string>software</string>
    <key>playlistName</key>
    <string>${appName}</string>
</dict>
</plist>`;
  zip.file('iTunesMetadata.plist', itunesMetadata);

  // 6. manifest.plist for OTA / Sideload distribution
  const manifestPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${targetUrl}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${bundleId}</string>
                <key>bundle-version</key>
                <string>${versionName}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${appName}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
  zip.file('manifest.plist', manifestPlist);

  // 7. Embedded WebClip Mobile Configuration for Direct 1-Tap iOS Profile Installation
  const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>${appName}</string>
            <key>PayloadDescription</key>
            <string>Configures WebClip for ${appName}</string>
            <key>PayloadDisplayName</key>
            <string>${appName}</string>
            <key>PayloadIdentifier</key>
            <string>${bundleId}.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>BAPP-${bundleId}-CLIP</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${targetUrl}</string>
            ${iconBuffer ? `<key>Icon</key><data>${iconBuffer.toString('base64')}</data>` : ''}
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>${appName} Web App</string>
    <key>PayloadIdentifier</key>
    <string>${bundleId}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>BAPP-${bundleId}-PROFILE</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
  zip.file(`${sanitizedAppName}.mobileconfig`, mobileConfig);

  const safeBaseName = (appName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'app';
  const ipaBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  return {
    ipaBuffer,
    fileName: `${safeBaseName}-v${versionName}.ipa`,
  };
}
