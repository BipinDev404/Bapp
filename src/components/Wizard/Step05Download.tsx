import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Package,
  FileCode,
  Smartphone,
  Apple,
  ExternalLink,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { BuildJob, Project } from '../../types';
import { downloadArtifactSafe } from '../../utils/downloadArtifact';

interface Step05DownloadProps {
  project: Project | null;
  build: BuildJob | null;
  onGoToDashboard: () => void;
  onStartNewApp: () => void;
}

export const Step05Download: React.FC<Step05DownloadProps> = ({
  project,
  build,
  onGoToDashboard,
  onStartNewApp,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const appName = project?.name || 'Bapp Application';
  const versionName = project?.config.versionName || '1.0.0';
  const platform = build?.platform || project?.targetPlatform || 'both';
  const safeBaseName = (appName || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'app';

  const handleDownload = async (
    type: 'android-apk' | 'android-project' | 'ios-project' | 'ios-ipa',
    defaultName: string
  ) => {
    if (!build) return;
    setDownloadingId(type);
    setDownloadStatus('Preparing package...');
    setDownloadSuccessId(null);

    const url = `/api/artifacts/${build.id}/${type}`;
    const res = await downloadArtifactSafe(url, defaultName, (status) => {
      setDownloadStatus(status);
    });

    setDownloadingId(null);
    if (res.success) {
      setDownloadSuccessId(type);
      setTimeout(() => setDownloadSuccessId(null), 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Your app is ready.
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
          Generated production-grade native project wrappers for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{appName}</span> (v{versionName}).
        </p>
      </div>

      {/* Artifact Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Android Card */}
        {(platform === 'android' || platform === 'both') && (
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Android Packages & Source
                    </h3>
                    <p className="text-[11px] text-neutral-500">Android 14 (API 34) • Kotlin • Gradle</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  Ready
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Includes full Android Studio project source files, <code className="font-mono text-[11px]">MainActivity.kt</code> with WebChromeClient file pickers, offline recovery screens, and debug package.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {build ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownload('android-apk', `${safeBaseName}-debug.apk`)}
                    disabled={downloadingId !== null}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                  >
                    {downloadingId === 'android-apk' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{downloadStatus || 'Packaging APK...'}</span>
                      </>
                    ) : downloadSuccessId === 'android-apk' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>APK Downloaded Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        <span>Download Installable APK (.apk)</span>
                        <span className="ml-auto bg-white/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Signed & Ready
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload('android-project', `${safeBaseName}-android-project.zip`)}
                    disabled={downloadingId !== null}
                    className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-75 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {downloadingId === 'android-project' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{downloadStatus || 'Preparing ZIP...'}</span>
                      </>
                    ) : downloadSuccessId === 'android-project' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Android Project Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Android Studio Source (.zip)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Sandbox-safe in-memory stream</span>
                    </span>
                    <a
                      href={`/api/artifacts/${build.id}/android-apk`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 transition"
                      title="Direct URL (opens in new tab)"
                    >
                      <span>Direct link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 border border-neutral-200/50 dark:border-neutral-700/50">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>How to install on Android phone:</span>
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                      <li>Download the APK file directly to your phone.</li>
                      <li>Tap the file in Downloads (allow "Unknown apps" if prompted).</li>
                      <li>Tap <strong>Install</strong> to launch your wrapped native webview app!</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-xs text-neutral-400 text-center py-2">
                  Build job pending or not generated yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* iOS Card */}
        {(platform === 'ios' || platform === 'both') && (
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-900 dark:text-white">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      iOS Packages & Source
                    </h3>
                    <p className="text-[11px] text-neutral-500">iOS 15.0+ • Swift 5.0 • WKWebView</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  Ready
                </span>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Includes direct installable iOS Application Package (<code className="font-mono text-[11px]">.ipa</code>) for sideloading and full Xcode project with <code className="font-mono text-[11px]">project.pbxproj</code> & WKWebView.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {build ? (
                <>
                  {/* Primary Button: Direct Installable IPA */}
                  <button
                    type="button"
                    onClick={() => handleDownload('ios-ipa', `${safeBaseName}-v${versionName}.ipa`)}
                    disabled={downloadingId !== null}
                    className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 disabled:opacity-75 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                  >
                    {downloadingId === 'ios-ipa' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{downloadStatus || 'Packaging IPA...'}</span>
                      </>
                    ) : downloadSuccessId === 'ios-ipa' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span>IPA Downloaded Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Apple className="w-4 h-4" />
                        <span>Download Installable IPA (.ipa)</span>
                        <span className="ml-auto bg-white/20 dark:bg-black/10 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Sideload Ready
                        </span>
                      </>
                    )}
                  </button>

                  {/* Secondary Button: Xcode Source Project */}
                  <button
                    type="button"
                    onClick={() => handleDownload('ios-project', `${safeBaseName}-ios-project.zip`)}
                    disabled={downloadingId !== null}
                    className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-75 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    {downloadingId === 'ios-project' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{downloadStatus || 'Preparing Xcode ZIP...'}</span>
                      </>
                    ) : downloadSuccessId === 'ios-project' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Xcode Project Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Xcode Project (.zip)</span>
                      </>
                    )}
                  </button>

                  {/* Bottom details & direct link */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Sandbox-safe in-memory stream</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/artifacts/${build.id}/ios-ipa`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 transition"
                        title="Direct IPA URL (opens in new tab)"
                      >
                        <span>Direct IPA</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span>•</span>
                      <a
                        href={`/api/artifacts/${build.id}/ios-project`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 transition"
                        title="Direct ZIP URL (opens in new tab)"
                      >
                        <span>Direct ZIP</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* iOS Installation Guide Box */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1 border border-neutral-200/50 dark:border-neutral-700/50">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <Apple className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                      <span>How to install on iPhone & iPad:</span>
                    </p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[10px] leading-tight text-neutral-500 dark:text-neutral-400">
                      <li>Download the <strong>.ipa</strong> file to your device or Mac/PC.</li>
                      <li>Sideload via <strong>Sideloadly</strong>, <strong>AltStore</strong>, <strong>TrollStore</strong>, or <strong>Scarlet</strong>.</li>
                      <li>Or open in <strong>Xcode</strong> to sign with your Apple ID and run on your iPhone!</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-xs text-neutral-400 text-center py-2">
                  Build job pending or not generated yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Guide Instructions Accordion */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>How to Run & Compile Your Downloaded Project</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="font-semibold text-neutral-900 dark:text-white block">
              1. Compiling in Android Studio
            </span>
            <p className="text-neutral-600 dark:text-neutral-400">
              Extract the ZIP file and select <strong>File → Open</strong> in Android Studio. Gradle will automatically sync all SDK dependencies.
            </p>
            <div className="bg-neutral-950 text-neutral-300 p-2.5 rounded-xl font-mono text-[11px]">
              ./gradlew assembleDebug<br />
              ./gradlew bundleRelease
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="font-semibold text-neutral-900 dark:text-white block">
              2. Compiling in Xcode (macOS)
            </span>
            <p className="text-neutral-600 dark:text-neutral-400">
              Unpack the iOS archive and double-click <code className="font-mono">{appName.replace(/[^a-zA-Z0-9]/g, '')}.xcodeproj</code>. Set your Apple Developer Team in Signing & Capabilities.
            </p>
            <div className="bg-neutral-950 text-neutral-300 p-2.5 rounded-xl font-mono text-[11px]">
              Product → Archive<br />
              Distribute to App Store Connect / TestFlight
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          onClick={onStartNewApp}
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
        >
          ← Package another website
        </button>

        <button
          type="button"
          onClick={onGoToDashboard}
          className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span>Go to Project Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
