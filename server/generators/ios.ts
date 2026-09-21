import JSZip from 'jszip';
import type { Project } from '../../src/types';
import { createShellConfig } from '../shellConfig';
import { createBridgeScript } from '../bridgeScript';

export async function generateIOSProjectZip(project: Project): Promise<{ zipBuffer: Buffer; fileName: string }> {
  const zip = new JSZip();
  const config = project.config;
  const bundleId = config.bundleId || config.packageId || 'com.example.bappdemo';
  const appName = config.appName || 'Bapp Demo';
  const targetUrl = project.websiteUrl || 'https://example.com';
  const sanitizedAppName = appName.replace(/[^a-zA-Z0-9]/g, '');
    const shellConfig = createShellConfig(project);
    const shellConfigJson = JSON.stringify(shellConfig);
    const bridgeScript = createBridgeScript(shellConfigJson);

  // Info.plist permissions & configuration
  const cameraUsage = config.enableCamera
    ? `    <key>NSCameraUsageDescription</key>\n    <string>${config.cameraPermissionReason || 'This app requires access to your camera to capture and upload photos.'}</string>`
    : '';

  const locationUsage = config.enableLocation
    ? `    <key>NSLocationWhenInUseUsageDescription</key>\n    <string>${config.locationPermissionReason || 'This app uses your location to provide personalized services.'}</string>`
    : '';

  const photoUsage = config.enableFileUpload
    ? `    <key>NSPhotoLibraryUsageDescription</key>\n    <string>This app requires access to your photo library to upload documents and photos.</string>`
    : '';

  const orientationKeys =
    config.orientation === 'portrait'
      ? '        <string>UIInterfaceOrientationPortrait</string>'
      : config.orientation === 'landscape'
      ? '        <string>UIInterfaceOrientationLandscapeLeft</string>\n        <string>UIInterfaceOrientationLandscapeRight</string>'
      : '        <string>UIInterfaceOrientationPortrait</string>\n        <string>UIInterfaceOrientationLandscapeLeft</string>\n        <string>UIInterfaceOrientationLandscapeRight</string>';

  // Info.plist
  zip.file(
    `${sanitizedAppName}/Info.plist`,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${config.versionName || '1.0.0'}</string>
    <key>CFBundleVersion</key>
    <string>${config.versionCode || 1}</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
        <key>UISceneConfigurations</key>
        <dict>
            <key>UIWindowSceneSessionRoleApplication</key>
            <array>
                <dict>
                    <key>UISceneConfigurationName</key>
                    <string>Default Configuration</string>
                    <key>UISceneDelegateClassName</key>
                    <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
                </dict>
            </array>
        </dict>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
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
${cameraUsage}
${locationUsage}
${photoUsage}
</dict>
</plist>
`
  );

  // AppDelegate.swift
  zip.file(
    `${sanitizedAppName}/AppDelegate.swift`,
    `import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    // MARK: UISceneSession Lifecycle
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
`
  );

  // SceneDelegate.swift
  zip.file(
    `${sanitizedAppName}/SceneDelegate.swift`,
    `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        let window = UIWindow(windowScene: windowScene)
        let viewController = ViewController()
        window.rootViewController = viewController
        self.window = window
        window.makeKeyAndVisible()
    }
}
`
  );

  // ViewController.swift with WKWebView & Pull to Refresh
  zip.file(
    `${sanitizedAppName}/ViewController.swift`,
    `import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var refreshControl: UIRefreshControl!
    private var offlineView: UIView!

    private let targetURLString = "${targetUrl}"
    private var primaryHost: String {
        return URL(string: targetURLString)?.host ?? ""
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        setupWebView()
        setupProgressView()
        setupOfflineView()

        if let url = URL(string: targetURLString) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.addUserScript(WKUserScript(source: "${bridgeScript.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        configuration.userContentController.add(BappBridge(), name: "bapp")

        ${config.userAgentAppend ? `configuration.applicationNameForUserAgent = "${config.userAgentAppend}"` : ''}

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.allowsBackForwardNavigationGestures = true

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        // Pull to refresh
        if ${config.pullToRefresh} {
            refreshControl = UIRefreshControl()
            refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)
            webView.scrollView.addSubview(refreshControl)
        }

        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
    }

    private func setupProgressView() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.tintColor = .label
        view.addSubview(progressView)

        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 2)
        ])
    }

    private func setupOfflineView() {
        offlineView = UIView()
        offlineView.backgroundColor = .systemBackground
        offlineView.translatesAutoresizingMaskIntoConstraints = false
        offlineView.isHidden = true

        let titleLabel = UILabel()
        titleLabel.text = "Connection Error"
        titleLabel.font = .boldSystemFont(ofSize: 20)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        let retryButton = UIButton(type: .system)
        retryButton.setTitle("Retry", for: .normal)
        retryButton.titleLabel?.font = .systemFont(ofSize: 16, weight: .medium)
        retryButton.addTarget(self, action: #selector(handleRetry), for: .touchUpInside)
        retryButton.translatesAutoresizingMaskIntoConstraints = false

        offlineView.addSubview(titleLabel)
        offlineView.addSubview(retryButton)
        view.addSubview(offlineView)

        NSLayoutConstraint.activate([
            offlineView.topAnchor.constraint(equalTo: view.topAnchor),
            offlineView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            offlineView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            offlineView.trailingAnchor.constraint(equalTo: view.trailingAnchor),

            titleLabel.centerXAnchor.constraint(equalTo: offlineView.centerXAnchor),
            titleLabel.centerYAnchor.constraint(equalTo: offlineView.centerYAnchor, constant: -20),

            retryButton.centerXAnchor.constraint(equalTo: offlineView.centerXAnchor),
            retryButton.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 16)
        ])
    }

    @objc private func handleRefresh() {
        webView.reload()
    }

    @objc private func handleRetry() {
        offlineView.isHidden = true
        webView.isHidden = false
        webView.reload()
    }

    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "estimatedProgress" {
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1.0
        }
    }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        // Open custom schemes externally
        if let scheme = url.scheme, scheme == "tel" || scheme == "mailto" || scheme == "sms" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }

        ${
          config.externalLinksBehavior === 'external_browser'
            ? `if let host = url.host, host != primaryHost && !host.hasSuffix("." + primaryHost) {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }`
            : ''
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        refreshControl?.endRefreshing()
        offlineView.isHidden = true
        webView.isHidden = false
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        refreshControl?.endRefreshing()
        offlineView.isHidden = false
        webView.isHidden = true
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        refreshControl?.endRefreshing()
        offlineView.isHidden = false
        webView.isHidden = true
    }

    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    }
}
`
  );

    zip.file(
        `${sanitizedAppName}/BappBridge.swift`,
        `import Foundation
import UIKit
import WebKit

final class BappBridge: NSObject, WKScriptMessageHandler {
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
                guard let body = message.body as? [String: Any],
                            let id = body["id"] as? String,
                            let method = body["method"] as? String else { return }
                let result: [String: Any]
                switch method {
                case "device.getInfo": result = ["platform": "ios", "version": "1.0.0"]
                case "haptics.trigger": UIImpactFeedbackGenerator(style: .light).impactOccurred(); result = [:]
                default: result = ["error": "Plugin not enabled or implemented: \\(method)"]
                }
                guard let webView = message.webView,
                            let data = try? JSONSerialization.data(withJSONObject: result),
                            let json = String(data: data, encoding: .utf8) else { return }
                let escaped = json.replacingOccurrences(of: "\\\\", with: "\\\\\\\\").replacingOccurrences(of: "'", with: "\\\\'")
                webView.evaluateJavaScript("window.__bappCallbacks && window.__bappCallbacks['\\(id)'] && window.__bappCallbacks['\\(id)'].resolve(JSON.parse('\\(escaped)'));", completionHandler: nil)
        }
}
`
    );
    zip.file(`${sanitizedAppName}/bapp-shell.json`, shellConfigJson);

  // Xcode project.pbxproj
  zip.file(
    `${sanitizedAppName}.xcodeproj/project.pbxproj`,
    `// !$*UTF8*$!
{
    archiveVersion = 1;
    classes = {
    };
    objectVersion = 54;
    objects = {
        /* Begin PBXBuildFile section */
        1D60589B0D05DD56006BFB54 /* main.m in Sources */ = {isa = PBXBuildFile; fileRef = 29B97316FDCFA39411CA2CEA /* main.m */; };
        /* End PBXBuildFile section */

        /* Begin PBXFileReference section */
        1D6058940D05DD3E006BFB54 /* ${appName}.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = "${appName}.app"; sourceTree = BUILT_PRODUCTS_DIR; };
        /* End PBXFileReference section */

        /* Begin PBXGroup section */
        29B97314FDCFA39411CA2CEA /* CustomGroup */ = {
            isa = PBXGroup;
            children = (
                1D6058940D05DD3E006BFB54 /* ${appName}.app */,
            );
            name = CustomGroup;
            sourceTree = "<group>";
        };
        /* End PBXGroup section */

        /* Begin PBXNativeTarget section */
        1D6058930D05DD3E006BFB54 /* ${appName} */ = {
            isa = PBXNativeTarget;
            buildConfigurationList = 1D6058960D05DD3E006BFB54 /* Build configuration list for PBXNativeTarget "${appName}" */;
            buildPhases = (
            );
            buildRules = (
            );
            dependencies = (
            );
            name = "${appName}";
            productName = "${appName}";
            productReference = 1D6058940D05DD3E006BFB54 /* ${appName}.app */;
            productType = "com.apple.product-type.application";
        };
        /* End PBXNativeTarget section */

        /* Begin PBXProject section */
        29B97313FDCFA39411CA2CEA /* Project object */ = {
            isa = PBXProject;
            attributes = {
                LastUpgradeCheck = 1500;
                TargetAttributes = {
                    1D6058930D05DD3E006BFB54 = {
                        CreatedOnToolsVersion = 15.0;
                    };
                };
            };
            buildConfigurationList = C01FCF4E08A9545400542410 /* Build configuration list for PBXProject "${appName}" */;
            compatibilityVersion = "Xcode 14.0";
            developmentRegion = en;
            hasScannedForEncodings = 0;
            knownRegions = (
                en,
                Base,
            );
            mainGroup = 29B97314FDCFA39411CA2CEA /* CustomGroup */;
            projectDirPath = "";
            projectRoot = "";
            targets = (
                1D6058930D05DD3E006BFB54 /* ${appName} */,
            );
        };
        /* End PBXProject section */

        /* Begin XCBuildConfiguration section */
        C01FCF4F08A9545400542410 /* Debug */ = {
            isa = XCBuildConfiguration;
            buildSettings = {
                ALWAYS_SEARCH_USER_PATHS = NO;
                CLANG_ANALYZER_NONNULL = YES;
                PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}";
                PRODUCT_NAME = "${appName}";
                SWIFT_VERSION = 5.0;
                IPHONEOS_DEPLOYMENT_TARGET = 15.0;
            };
            name = Debug;
        };
        C01FCF5008A9545400542410 /* Release */ = {
            isa = XCBuildConfiguration;
            buildSettings = {
                ALWAYS_SEARCH_USER_PATHS = NO;
                CLANG_ANALYZER_NONNULL = YES;
                PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}";
                PRODUCT_NAME = "${appName}";
                SWIFT_VERSION = 5.0;
                IPHONEOS_DEPLOYMENT_TARGET = 15.0;
            };
            name = Release;
        };
        1D6058970D05DD3E006BFB54 /* Debug */ = {
            isa = XCBuildConfiguration;
            buildSettings = {
                INFOPLIST_FILE = "${sanitizedAppName}/Info.plist";
                PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}";
                PRODUCT_NAME = "${appName}";
            };
            name = Debug;
        };
        1D6058980D05DD3E006BFB54 /* Release */ = {
            isa = XCBuildConfiguration;
            buildSettings = {
                INFOPLIST_FILE = "${sanitizedAppName}/Info.plist";
                PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}";
                PRODUCT_NAME = "${appName}";
            };
            name = Release;
        };
        /* End XCBuildConfiguration section */

        /* Begin XCConfigurationList section */
        C01FCF4E08A9545400542410 /* Build configuration list for PBXProject "${appName}" */ = {
            isa = XCConfigurationList;
            buildConfigurations = (
                C01FCF4F08A9545400542410 /* Debug */,
                C01FCF5008A9545400542410 /* Release */,
            );
            defaultConfigurationIsVisible = 0;
            defaultConfigurationName = Release;
        };
        1D6058960D05DD3E006BFB54 /* Build configuration list for PBXNativeTarget "${appName}" */ = {
            isa = XCConfigurationList;
            buildConfigurations = (
                1D6058970D05DD3E006BFB54 /* Debug */,
                1D6058980D05DD3E006BFB54 /* Release */,
            );
            defaultConfigurationIsVisible = 0;
            defaultConfigurationName = Release;
        };
        /* End XCConfigurationList section */
    };
    rootObject = 29B97313FDCFA39411CA2CEA /* Project object */;
}
`
  );

  // README with instructions on Apple Developer signing & Xcode build
  zip.file(
    'README.md',
    `# ${appName} — iOS Xcode Project

Generated by **Bapp** (Turn any website into a mobile app).

### Project Configuration
- **Bundle ID:** \`${bundleId}\`
- **Target URL:** \`${targetUrl}\`
- **Deployment Target:** iOS 15.0+
- **Renderer:** \`WKWebView\` with modern WebKit navigation delegate and file chooser handlers

### Opening in Xcode
1. Open \`${sanitizedAppName}.xcodeproj\` in Xcode on your Mac.
2. Select your development team under **Signing & Capabilities**.
3. Choose your target simulator or physical iPhone / iPad.
4. Press **⌘R** to run.

### Building for App Store / TestFlight
\`\`\`bash
xcodebuild -project ${sanitizedAppName}.xcodeproj -scheme ${sanitizedAppName} -configuration Release archive -archivePath build/${sanitizedAppName}.xcarchive
\`\`\`
`
  );

  // Asset Catalog
  zip.file(
    `${sanitizedAppName}/Assets.xcassets/Contents.json`,
    JSON.stringify(
      {
        info: {
          author: 'xcode',
          version: 1,
        },
      },
      null,
      2
    )
  );

  zip.file(
    `${sanitizedAppName}/Assets.xcassets/AppIcon.appiconset/Contents.json`,
    JSON.stringify(
      {
        images: [
          {
            idiom: 'universal',
            platform: 'ios',
            size: '1024x1024',
            filename: 'icon-1024.png',
          },
        ],
        info: {
          author: 'xcode',
          version: 1,
        },
      },
      null,
      2
    )
  );

  if (config.iconBase64 && config.iconBase64.includes('base64,')) {
    try {
      const rawBase64 = config.iconBase64.split('base64,')[1];
      const iconBuffer = Buffer.from(rawBase64, 'base64');
      zip.file(
        `${sanitizedAppName}/Assets.xcassets/AppIcon.appiconset/icon-1024.png`,
        iconBuffer
      );
    } catch (e) {
      console.warn('Failed to inject iconBase64 into iOS xcassets:', e);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return {
    zipBuffer,
    fileName: `${sanitizedName}-ios-xcode-project.zip`,
  };
}
