import JSZip from 'jszip';
import type { Project } from '../../src/types';

export async function generateAndroidProjectZip(project: Project): Promise<{ zipBuffer: Buffer; fileName: string }> {
  const zip = new JSZip();
  const config = project.config;
  const packageId = config.packageId || 'com.example.bappdemo';
  const appName = config.appName || 'Bapp Demo';
  const targetUrl = project.websiteUrl || 'https://example.com';
  const packagePath = packageId.replace(/\./g, '/');

  // Root files
  zip.file(
    'build.gradle',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    ext.kotlin_version = '1.9.22'
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`
  );

  zip.file(
    'settings.gradle',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${appName.replace(/[^a-zA-Z0-9_-]/g, '')}"
include ':app'
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`
  );

  // Gradle Wrapper
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  zip.file(
    'gradlew',
    `#!/usr/bin/env sh
exec gradle "$@"
`,
    { unixPermissions: '755' }
  );

  // app/build.gradle
  zip.file(
    'app/build.gradle',
    `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${packageId}'
    compileSdk 34

    defaultConfig {
        applicationId "${packageId}"
        minSdk 24
        targetSdk 34
        versionCode ${config.versionCode || 1}
        versionName "${config.versionName || '1.0.0'}"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.webkit:webkit:1.10.0'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
    implementation 'androidx.activity:activity-ktx:1.8.2'
}
`
  );

  zip.file('app/proguard-rules.pro', `# Proguard rules for Bapp WebView wrapper\n-keepclassmembers class * {\n    @android.webkit.JavascriptInterface <methods>;\n}\n`);

  // Manifest permissions
  const permissions = [
    '    <uses-permission android:name="android.permission.INTERNET" />',
    '    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
  ];

  if (config.enableCamera) {
    permissions.push('    <uses-permission android:name="android.permission.CAMERA" />');
    permissions.push('    <uses-feature android:name="android.hardware.camera" android:required="false" />');
  }

  if (config.enableLocation) {
    permissions.push('    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />');
    permissions.push('    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />');
  }

  if (config.enableNotifications) {
    permissions.push('    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />');
  }

  const orientationAttr =
    config.orientation === 'portrait'
      ? 'android:screenOrientation="portrait"'
      : config.orientation === 'landscape'
      ? 'android:screenOrientation="landscape"'
      : 'android:screenOrientation="unspecified"';

  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

${permissions.join('\n')}

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Bapp"
        android:usesCleartextTraffic="${!project.websiteUrl.startsWith('https://')}"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            ${orientationAttr}
            android:theme="@style/Theme.Bapp">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${packageId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
`
  );

  // XML resources
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">${appName}</string>
    <string name="error_offline_title">No Internet Connection</string>
    <string name="error_offline_message">Please check your network settings and try again.</string>
    <string name="retry">Retry</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/colors.xml',
    `<resources>
    <color name="bapp_primary">${config.themeColor || '#0A0A0A'}</color>
    <color name="bapp_background">${config.backgroundColor || '#F7F7F5'}</color>
    <color name="white">#FFFFFFFF</color>
    <color name="black">#FF000000</color>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.Bapp" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/bapp_primary</item>
        <item name="android:statusBarColor">@color/bapp_primary</item>
        <item name="android:windowBackground">@color/bapp_background</item>
    </style>
</resources>
`
  );

  zip.file(
    'app/src/main/res/xml/file_paths.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="Android/data/${packageId}/files/Pictures" />
    <cache-path name="cache" path="." />
</paths>
`
  );

  zip.file(
    'app/src/main/res/xml/backup_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
</full-backup-content>
`
  );

  zip.file(
    'app/src/main/res/xml/data_extraction_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
    </cloud-backup>
    <device-transfer>
    </device-transfer>
</data-extraction-rules>
`
  );

  // App Launcher Icon Resources (Adaptive Icons for API 26+)
  zip.file(
    'app/src/main/res/values/ic_launcher_background.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${config.themeColor || '#0A0A0A'}</color>
</resources>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_launcher_foreground.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M34,34h40v40h-40z"/>
    <path
        android:fillColor="#FF38BDF8"
        android:pathData="M44,44h20v20h-20z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  zip.file(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  // If a custom base64 icon was provided, inject PNGs into standard mipmap folders
  if (config.iconBase64 && config.iconBase64.includes('base64,')) {
    try {
      const rawBase64 = config.iconBase64.split('base64,')[1];
      const iconBuffer = Buffer.from(rawBase64, 'base64');
      const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
      densities.forEach((density) => {
        zip.file(`app/src/main/res/mipmap-${density}/ic_launcher.png`, iconBuffer);
        zip.file(`app/src/main/res/mipmap-${density}/ic_launcher_round.png`, iconBuffer);
      });
    } catch (e) {
      console.warn('Failed to parse custom iconBase64 for Android mipmaps:', e);
    }
  }

  // Layout XML
  zip.file(
    'app/src/main/res/layout/activity_main.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefresh"
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:indeterminate="false"
        android:max="100"
        android:visibility="gone" />

    <LinearLayout
        android:id="@+id/offlineLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="24dp"
        android:visibility="gone">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/error_offline_title"
            android:textSize="20sp"
            android:textStyle="bold" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="@string/error_offline_message"
            android:textSize="14sp" />

        <Button
            android:id="@+id/btnRetry"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:text="@string/retry" />

    </LinearLayout>

</androidx.coordinatorlayout.widget.CoordinatorLayout>
`
  );

  // Kotlin MainActivity.kt
  zip.file(
    `app/src/main/java/${packagePath}/MainActivity.kt`,
    `package ${packageId}

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineLayout: LinearLayout
    private lateinit var btnRetry: Button

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult
        val results: Array<Uri>? = when {
            result.resultCode == RESULT_OK && result.data?.data != null -> arrayOf(result.data!!.data!!)
            result.resultCode == RESULT_OK && result.data?.clipData != null -> {
                val clip = result.data!!.clipData!!
                Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
            }
            else -> null
        }
        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    private val targetUrl = "${targetUrl}"
    private val allowedHost = Uri.parse(targetUrl).host ?: ""

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        offlineLayout = findViewById(R.id.offlineLayout)
        btnRetry = findViewById(R.id.btnRetry)

        configureSwipeRefresh()
        configureWebView()
        setupBackNavigation()

        btnRetry.setOnClickListener {
            offlineLayout.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.reload()
        }

        if (savedInstanceState == null) {
            webView.loadUrl(targetUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    private fun configureSwipeRefresh() {
        val isPullToRefreshEnabled = ${config.pullToRefresh}
        swipeRefresh.isEnabled = isPullToRefreshEnabled
        if (isPullToRefreshEnabled) {
            swipeRefresh.setOnRefreshListener {
                webView.reload()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = ${config.enableJavaScript}
        settings.domStorageEnabled = ${config.enableDomStorage}
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.allowFileAccess = false
        settings.allowContentAccess = false

        ${config.userAgentAppend ? `settings.userAgentString = settings.userAgentString + " ${config.userAgentAppend}"` : ''}

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                val host = uri.host ?: ""

                // Handle external links or custom protocols
                if (uri.scheme == "tel" || uri.scheme == "mailto" || uri.scheme == "sms") {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                    return true
                }

                ${
                  config.externalLinksBehavior === 'external_browser'
                    ? `if (host != allowedHost && !host.endsWith(".$allowedHost")) {
                    val intent = Intent(Intent.ACTION_VIEW, uri)
                    startActivity(intent)
                    return true
                }`
                    : ''
                }

                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                offlineLayout.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    webView.visibility = View.GONE
                    offlineLayout.visibility = View.VISIBLE
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                view: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                return try {
                    filePickerLauncher.launch(intent)
                    true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    false
                }
            }

            ${
              config.enableLocation
                ? `override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }`
                : ''
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }
}
`
  );

  // Add README
  zip.file(
    'README.md',
    `# ${appName} — Android Project

Generated by **Bapp** (Turn any website into a mobile app).

### Project Configuration
- **Application ID:** \`${packageId}\`
- **Target URL:** \`${targetUrl}\`
- **Target SDK:** 34 (Android 14)
- **Min SDK:** 24 (Android 7.0)

### Opening in Android Studio
1. Launch Android Studio.
2. Select **Open** and choose this project directory.
3. Allow Gradle to sync.

### Building APK & AAB from Command Line
\`\`\`bash
# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease

# Android App Bundle (for Google Play)
./gradlew bundleRelease
\`\`\`
`
  );

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return {
    zipBuffer,
    fileName: `${sanitizedName}-android-project.zip`,
  };
}
