import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, AlertCircle, Smartphone, Compass, Shield, Palette } from 'lucide-react';
import type { ProjectConfig } from '../../types';

interface Step02ConfigureProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  favicon?: string;
  onNext: () => void;
  onBack: () => void;
}

export const Step02Configure: React.FC<Step02ConfigureProps> = ({
  config,
  setConfig,
  favicon,
  onNext,
  onBack,
}) => {
  const [packageError, setPackageError] = useState<string | null>(null);

  const validatePackage = (val: string) => {
    const pattern = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;
    if (!pattern.test(val)) {
      setPackageError('Must be reverse-domain format (e.g. com.company.app) with 2+ parts.');
    } else {
      setPackageError(null);
    }
  };

  const handlePackageChange = (val: string) => {
    setConfig((prev) => ({
      ...prev,
      packageId: val,
      bundleId: val,
    }));
    validatePackage(val);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid PNG, JPG, or WEBP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setConfig((prev) => ({
        ...prev,
        iconBase64: base64,
        iconUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Configure Mobile Application
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Customize naming, native package identities, display orientations, and navigation controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              App Name
            </label>
            <span className="text-[10px] text-neutral-400 font-mono">Mobile Title</span>
          </div>
          <input
            type="text"
            value={config.appName}
            onChange={(e) => {
              const val = e.target.value;
              setConfig((prev) => ({ ...prev, appName: val }));
            }}
            placeholder="Bapp Demo"
            className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
          />
          <p className="text-[11px] text-neutral-500">
            App label displayed under the app icon on device home screens.
          </p>
        </div>

        {/* Package ID */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Android Package ID / iOS Bundle ID
            </label>
            <button
              type="button"
              onClick={() => {
                const cleanName = (config.appName || 'app')
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '');
                const generated = `com.bapp.${cleanName || 'mobileapp'}`;
                handlePackageChange(generated);
              }}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
            >
              Auto-generate
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={config.packageId}
              onChange={(e) => handlePackageChange(e.target.value)}
              placeholder="com.mycompany.app"
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
            />
          </div>
          {packageError ? (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {packageError}
            </p>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Used in AndroidManifest.xml, build.gradle, and iOS Info.plist.</span>
              <span className="font-mono text-[10px] text-neutral-400">Renameable anytime</span>
            </div>
          )}
        </div>
      </div>

      {/* App Icon & Visual Branding */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              App Icon & Visual Branding
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Live in Phone Preview
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
          {/* Icon Preview */}
          <div className="relative group shrink-0">
            <div
              className="w-20 h-20 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shadow-md transition-transform"
              style={{
                backgroundColor: config.iconBase64 || config.iconUrl ? '#ffffff' : config.themeColor || '#0A0A0A',
              }}
            >
              {config.iconBase64 || config.iconUrl ? (
                <img
                  src={config.iconBase64 || config.iconUrl}
                  alt="App Icon Preview"
                  className="w-full h-full object-cover"
                />
              ) : favicon ? (
                <img
                  src={favicon}
                  alt="Favicon Icon"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {(config.appName?.trim()?.charAt(0) || 'B').toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Icon</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </label>

              {favicon && (config.iconBase64 || config.iconUrl !== favicon) && (
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      iconBase64: undefined,
                      iconUrl: favicon,
                    }))
                  }
                  className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold transition"
                >
                  Use Favicon
                </button>
              )}

              {(config.iconBase64 || config.iconUrl) && (
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      iconBase64: undefined,
                      iconUrl: undefined,
                    }))
                  }
                  className="px-3 py-2 text-neutral-500 hover:text-red-500 text-xs transition font-medium"
                >
                  Reset to Default
                </button>
              )}
            </div>

            <p className="text-[11px] text-neutral-500">
              Generates all Android mipmap densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) and iOS Assets.xcassets sets automatically.
            </p>
          </div>
        </div>

        {/* Theme Color & Splash Color Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {/* Theme Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Theme Color (Status Bar & Header)
              </label>
              <span className="text-[10px] font-mono text-neutral-500">{config.themeColor || '#0A0A0A'}</span>
            </div>

            {/* Quick Color Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { name: 'Black', hex: '#000000' },
                { name: 'Dark', hex: '#0A0A0A' },
                { name: 'Charcoal', hex: '#18181B' },
                { name: 'Slate', hex: '#334155' },
                { name: 'Blue', hex: '#2563EB' },
                { name: 'Emerald', hex: '#059669' },
                { name: 'Violet', hex: '#7C3AED' },
                { name: 'White', hex: '#FFFFFF' },
              ].map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, themeColor: swatch.hex }))}
                  className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer flex items-center justify-center ${
                    (config.themeColor || '#0A0A0A').toLowerCase() === swatch.hex.toLowerCase()
                      ? 'scale-110 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={`${swatch.name} (${swatch.hex})`}
                >
                  {(config.themeColor || '#0A0A0A').toLowerCase() === swatch.hex.toLowerCase() && (
                    <span
                      className={`text-[10px] font-bold ${
                        swatch.hex === '#FFFFFF' ? 'text-black' : 'text-white'
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex + Picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.themeColor || '#0A0A0A'}
                onChange={(e) => setConfig((prev) => ({ ...prev, themeColor: e.target.value }))}
                className="w-9 h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent shrink-0"
              />
              <input
                type="text"
                value={config.themeColor || '#0A0A0A'}
                onChange={(e) => setConfig((prev) => ({ ...prev, themeColor: e.target.value }))}
                placeholder="#000000"
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
          </div>

          {/* Splash Background Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                Splash Screen Background
              </label>
              <span className="text-[10px] font-mono text-neutral-500">
                {config.splashBackgroundColor || '#0A0A0A'}
              </span>
            </div>

            {/* Quick Color Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { name: 'Black', hex: '#000000' },
                { name: 'Dark', hex: '#0A0A0A' },
                { name: 'Charcoal', hex: '#18181B' },
                { name: 'Slate', hex: '#334155' },
                { name: 'Blue', hex: '#2563EB' },
                { name: 'Emerald', hex: '#059669' },
                { name: 'Violet', hex: '#7C3AED' },
                { name: 'White', hex: '#FFFFFF' },
              ].map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, splashBackgroundColor: swatch.hex }))
                  }
                  className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer flex items-center justify-center ${
                    (config.splashBackgroundColor || '#0A0A0A').toLowerCase() === swatch.hex.toLowerCase()
                      ? 'scale-110 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-neutral-300 dark:border-neutral-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                  title={`${swatch.name} (${swatch.hex})`}
                >
                  {(config.splashBackgroundColor || '#0A0A0A').toLowerCase() ===
                    swatch.hex.toLowerCase() && (
                    <span
                      className={`text-[10px] font-bold ${
                        swatch.hex === '#FFFFFF' ? 'text-black' : 'text-white'
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Hex + Picker */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.splashBackgroundColor || '#0A0A0A'}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, splashBackgroundColor: e.target.value }))
                }
                className="w-9 h-9 rounded-xl border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent shrink-0"
              />
              <input
                type="text"
                value={config.splashBackgroundColor || '#0A0A0A'}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, splashBackgroundColor: e.target.value }))
                }
                placeholder="#000000"
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orientation & Navigation Configuration */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Display & Navigation Behavior
          </h3>
        </div>

        {/* Orientation Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            Screen Orientation
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['auto', 'portrait', 'landscape'] as const).map((orient) => (
              <button
                key={orient}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, orientation: orient }))}
                className={`py-2.5 px-3 rounded-2xl text-xs font-medium capitalize border transition cursor-pointer ${
                  config.orientation === orient
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm font-semibold'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                }`}
              >
                {orient}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                Pull to Refresh
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Swipe down from top to reload website
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.pullToRefresh}
              onChange={(e) => setConfig((prev) => ({ ...prev, pullToRefresh: e.target.checked }))}
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                Swipe Gestures
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Edge swiping for forward/backward page navigation
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.swipeNavigation}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, swipeNavigation: e.target.checked }))
              }
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                Bottom Navigation Bar
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Optional native browser bottom bar
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.bottomNavigation}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, bottomNavigation: e.target.checked }))
              }
              className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4 cursor-pointer"
            />
          </label>

          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
              Back Button Action
            </span>
            <select
              value={config.backButtonBehavior}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  backButtonBehavior: e.target.value as 'history' | 'exit' | 'confirm',
                }))
              }
              className="mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1 text-xs text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="history">Navigate website history</option>
              <option value="confirm">Prompt confirmation before exit</option>
              <option value="exit">Immediately exit app</option>
            </select>
          </div>
        </div>
      </div>

      {/* External Links Whitelisting */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            External Links & Navigation Routing
          </h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'external_browser', label: 'Open in External Browser', desc: 'Secure default for external domains' },
              { id: 'in_app', label: 'Open Inside WebView', desc: 'Keep user inside app wrapper' },
              { id: 'ask', label: 'Prompt User', desc: 'Ask user before opening link' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    externalLinksBehavior: opt.id as 'in_app' | 'external_browser' | 'ask',
                  }))
                }
                className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                  config.externalLinksBehavior === opt.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                }`}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-[10px] opacity-75 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={Boolean(packageError) || !config.appName.trim()}
          className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40"
        >
          <span>Continue to Permissions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
