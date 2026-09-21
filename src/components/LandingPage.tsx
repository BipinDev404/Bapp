import React, { useState } from 'react';
import {
  ArrowRight,
  Globe,
  Smartphone,
  Apple,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Layers,
  Cpu,
  Lock,
  Terminal,
  Zap,
  User,
  Github,
  Quote,
  ExternalLink,
  MapPin,
  Briefcase
} from 'lucide-react';

interface LandingPageProps {
  onStartCreate: (url: string) => void;
  onOpenDeveloper?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartCreate, onOpenDeveloper }) => {
  const [url, setUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onStartCreate(url.trim());
  };

  const faqs = [
    {
      q: 'Can I convert any website into a mobile app?',
      a: 'Yes, Bapp can package any responsive web application or website using modern Android WebView and Apple WKWebView wrappers. For best user experience, your website should have a responsive viewport and HTTPS enabled.',
    },
    {
      q: 'Can I generate an installable Android APK and AAB?',
      a: 'Yes! Bapp generates complete Android Studio projects with Kotlin source code, Gradle configurations, and compiles development APK packages directly. For Google Play store distribution, you can download the project and run ./gradlew bundleRelease.',
    },
    {
      q: 'Can I generate a native iOS app?',
      a: 'Bapp generates complete, compilable Xcode projects with WKWebView, SceneDelegate, and Info.plist permissions configured for iOS 15+. Because Apple requires macOS and Xcode for signed IPA builds, you can download the clean Xcode project ZIP and open it directly on any Mac or cloud CI.',
    },
    {
      q: 'Can I customize the app icon and splash screen?',
      a: 'Yes. You can upload custom icons (1024×1024 recommended) and select status bar / splash screen colors. Bapp generates all required Android mipmap densities and iOS asset catalog sets automatically.',
    },
    {
      q: 'Are native file uploads, camera, and geolocation supported?',
      a: 'Yes. Bapp automatically configures Android WebChromeClient file pickers for <input type="file"> (supporting camera capture, gallery selection, and PDF documents) and provides permission declarations for Camera and Geolocation in AndroidManifest.xml and Info.plist.',
    },
    {
      q: 'Can I publish my app to the Google Play Store and Apple App Store?',
      a: 'Yes. Bapp generates the real production application packages and source projects. Store acceptance is subject to Apple and Google store guidelines regarding content uniqueness and web wrap policies.',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 pt-16 pb-20 text-center flex flex-col items-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Production-grade Android & iOS wrappers</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-950 dark:text-white max-w-3xl leading-[1.12]">
          Turn your website into an app.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mt-5 max-w-2xl font-normal leading-relaxed">
          Wrap your web experience into a production-ready mobile application for Android and iOS with native permissions, offline handling, and complete source code.
        </p>

        {/* Interactive URL Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mt-8">
          <div className="relative flex items-center p-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-lg focus-within:ring-2 focus-within:ring-neutral-950 dark:focus-within:ring-white transition">
            <div className="pl-3.5 pr-2 text-neutral-400 flex items-center">
              <Globe className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full py-2.5 bg-transparent text-neutral-900 dark:text-white text-sm placeholder-neutral-400 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>Create app</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-2.5">
            No coding required • Generates Android Kotlin & iOS Xcode project ZIPs
          </p>
        </form>

        {/* Clean Micro-Architecture Diagram (Website -> Bapp -> Android + iOS) */}
        <div className="mt-14 w-full max-w-2xl p-6 bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 font-mono">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <Globe className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="font-semibold text-neutral-900 dark:text-white">Your Website</span>
              <span className="text-[10px] text-neutral-400">HTTPS / Responsive</span>
            </div>

            <div className="flex-1 flex items-center justify-center px-2">
              <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-400" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-md">
                <span className="font-bold text-lg tracking-tighter">bapp</span>
              </div>
              <span className="font-semibold text-neutral-900 dark:text-white">Bapp Engine</span>
              <span className="text-[10px] text-neutral-400">Wrappers & Config</span>
            </div>

            <div className="flex-1 flex items-center justify-center px-2">
              <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-neutral-400" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-neutral-200 dark:border-neutral-700">
                  <Smartphone className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                  <Apple className="w-5 h-5 stroke-[1.5]" />
                </div>
              </div>
              <span className="font-semibold text-neutral-900 dark:text-white">Android + iOS</span>
              <span className="text-[10px] text-neutral-400">APK, AAB & Xcode</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full bg-white dark:bg-neutral-900/40 border-y border-neutral-200 dark:border-neutral-800 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
              Workflow
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
              How it works
            </h2>
            <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
              Three simple steps to transform your web application into native mobile project packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#F7F7F5] dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-mono text-xs font-bold">
                1
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Enter your website
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Provide your URL. Our SSRF-protected analyzer inspects SSL certificates, viewport responsiveness, PWA manifests, and service workers automatically.
              </p>
            </div>

            <div className="p-6 bg-[#F7F7F5] dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-mono text-xs font-bold">
                2
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Configure your app
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Set application name, reverse-domain package IDs, splash screen branding, pull-to-refresh gestures, external URL whitelists, and native permissions.
              </p>
            </div>

            <div className="p-6 bg-[#F7F7F5] dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-mono text-xs font-bold">
                3
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Build and download
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Compile real Android APK packages and download complete Android Studio & Xcode source project archives ready for local compilation and store submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Features
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
            Built for developers and creators
          </h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            Everything you need to turn your website into a real mobile app package without boilerplate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Smartphone className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Real Android Kotlin Source
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Clean Kotlin project with Android SDK 34, AndroidX, and Gradle wrapper. Open directly in Android Studio.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Apple className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              iOS Xcode Project Generation
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Generates genuine Xcode projects with WKWebView, SceneDelegate, and Info.plist ready for macOS signing.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Zap className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Native File Uploads
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Full <code className="font-mono text-[11px]">&lt;input type="file"&gt;</code> support via WebChromeClient for photos, camera shots, and documents.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Lock className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Hardened WebView Security
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Strict DOM storage, blocked arbitrary file:// schemes, mixed-content protections, and domain whitelisting.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Layers className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Offline Error Screen & Retry
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Gracefully intercepts network failures with an integrated native retry layout instead of raw browser errors.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-2">
            <Terminal className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Real-Time Build Logs
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Inspect terminal logs, artifact checksums, compilation milestones, and secrets redaction live.
            </p>
          </div>
        </div>
      </section>

      {/* App Store / Play Store Reality Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-neutral-700 dark:text-neutral-300 flex-shrink-0 mt-1" />
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              App Store & Google Play Store Reality
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Bapp generates the production application packages, Android source code, and Xcode projects. For Android, your APK can be installed directly, and the AAB bundle can be uploaded to Google Play. For iOS, Xcode projects can be opened and signed with your Apple Developer account. Store review and acceptance depend on the respective platform policies and the uniqueness of your application experience.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-colors ${
                  isOpen
                    ? 'bg-neutral-50/80 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer bg-transparent hover:bg-neutral-100/70 dark:hover:bg-neutral-800/80 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                >
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-200/60 dark:border-neutral-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* About the Developer Spotlight Section */}
      <section className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="p-8 sm:p-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-700 shrink-0 bg-neutral-900 dark:bg-white">
                <img
                  src="https://github.com/BipinDev404.png"
                  alt="Bipin Yadav"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="avatar-fallback hidden w-full h-full text-white dark:text-neutral-900 items-center justify-center font-bold text-2xl">
                  BY
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    About the Developer
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    @BipinDev404
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Bipin Yadav • Founder & Developer
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Bihar, India • Software Development & Technology
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href="https://github.com/BipinDev404"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              {onOpenDeveloper && (
                <button
                  type="button"
                  onClick={onOpenDeveloper}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Full Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Bio & Quote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <p>
                Hi, I'm <strong className="text-neutral-900 dark:text-white font-semibold">Bipin Yadav</strong>, a developer and technology enthusiast from Bihar, India. I enjoy building websites, applications, developer tools, and experimental software projects.
              </p>
              <p>
                I'm a software developer and BCA student with a strong interest in web, mobile, cybersecurity, and emerging technologies. I love turning ideas into real, useful products.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/60 rounded-2xl flex flex-col justify-center text-xs">
              <p className="italic text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
                "I don't just want to learn technology. I want to use it to build something real."
              </p>
              <span className="text-[11px] text-neutral-400 font-semibold mt-2">
                — Bipin Yadav
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 py-10 text-center text-xs text-neutral-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-white tracking-tighter">bapp</span>
            <span>• Turn any website into an app</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            {onOpenDeveloper && (
              <button
                onClick={onOpenDeveloper}
                className="hover:text-neutral-900 dark:hover:text-white transition cursor-pointer font-medium text-neutral-600 dark:text-neutral-400"
              >
                About the Developer
              </button>
            )}
            <span>•</span>
            <a
              href="https://github.com/BipinDev404"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            <span>•</span>
            <span>Android SDK 34</span>
            <span>•</span>
            <span>Xcode 15</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
