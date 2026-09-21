import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  RotateCw,
  RefreshCw,
  Wifi,
  Battery,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  Home,
  Camera,
  MessageSquare,
  Music,
  Compass,
  Phone,
  Settings,
  Mail,
  Calendar,
  CloudSun,
  Package,
  Info,
} from 'lucide-react';
import type { ProjectConfig } from '../types';

interface PhonePreviewProps {
  url: string;
  config: ProjectConfig;
  title?: string;
  favicon?: string;
}

function isLightColor(hex?: string): boolean {
  if (!hex || hex === 'transparent') return false;
  const clean = hex.replace('#', '').trim();
  let r = 0;
  let g = 0;
  let b = 0;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16) || 0;
    g = parseInt(clean[1] + clean[1], 16) || 0;
    b = parseInt(clean[2] + clean[2], 16) || 0;
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16) || 0;
    g = parseInt(clean.slice(2, 4), 16) || 0;
    b = parseInt(clean.slice(4, 6), 16) || 0;
  } else {
    return false;
  }
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ url, config, title, favicon }) => {
  const [device, setDevice] = useState<'ios' | 'android'>('android');
  const [viewState, setViewState] = useState<'in_app' | 'home_screen'>('in_app');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [previewMode, setPreviewMode] = useState<'proxy' | 'direct'>('proxy');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string>(url || '');
  const [imgError, setImgError] = useState(false);

  const effectiveIcon = config.iconBase64 || config.iconUrl || favicon;
  const appDisplayName = config.appName || title || 'Bapp App';
  const initialChar = (appDisplayName.trim().charAt(0) || 'B').toUpperCase();
  const activePackageId = config.packageId || config.bundleId || 'com.bapp.app';
  const effectiveThemeColor = config.themeColor || '#0A0A0A';
  const isLightHeader = isLightColor(effectiveThemeColor);
  const headerTextColor = isLightHeader ? '#18181b' : '#ffffff';

  // Reset img error when icon source changes
  useEffect(() => {
    setImgError(false);
  }, [effectiveIcon]);

  // Keep internal URL in sync with prop updates
  useEffect(() => {
    if (url) {
      setActiveUrl(url);
      setIsLoading(true);
      setIframeKey((k) => k + 1);
    }
  }, [url]);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  };

  const handleSplashDemo = () => {
    setViewState('in_app');
    setShowSplash(true);
    setTimeout(() => setShowSplash(false), 1400);
  };

  const handleLaunchApp = () => {
    setShowSplash(true);
    setViewState('in_app');
    setTimeout(() => setShowSplash(false), 1100);
  };

  const isLandscape = orientation === 'landscape';

  // Compute effective iframe src
  const computedSrc = React.useMemo(() => {
    if (!activeUrl) return '';
    if (previewMode === 'proxy') {
      return `/api/preview-proxy?url=${encodeURIComponent(activeUrl)}`;
    }
    return activeUrl;
  }, [activeUrl, previewMode, iframeKey]);

  // Display URL in the mobile address bar
  const displayHost = React.useMemo(() => {
    if (!activeUrl) return 'bapp.local';
    try {
      const u = new URL(activeUrl.startsWith('http') ? activeUrl : `https://${activeUrl}`);
      return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
      return activeUrl.replace(/^https?:\/\//i, '');
    }
  }, [activeUrl]);

  // Render App Icon with reliable fallback
  const renderAppIcon = (sizeClass = 'w-10 h-10', textClass = 'text-sm font-bold', roundedClass = 'rounded-2xl') => {
    if (effectiveIcon && !imgError) {
      return (
        <img
          src={effectiveIcon}
          alt={appDisplayName}
          className={`${sizeClass} ${roundedClass} object-cover shadow-sm bg-white shrink-0`}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} ${roundedClass} flex items-center justify-center text-white ${textClass} shadow-md shrink-0 transition-transform`}
        style={{
          backgroundColor: effectiveThemeColor,
          color: isLightHeader ? '#09090b' : '#ffffff',
        }}
      >
        {initialChar}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top Device & View Mode Controls */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-3 py-1.5 shadow-sm text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {/* Device Switcher */}
        <button
          onClick={() => setDevice('android')}
          className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
            device === 'android'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
              : 'hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Android</span>
        </button>

        <button
          onClick={() => setDevice('ios')}
          className={`px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
            device === 'ios'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold'
              : 'hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>iOS</span>
        </button>

        <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Home Screen / In-App Toggle */}
        <button
          onClick={() => setViewState('home_screen')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
            viewState === 'home_screen'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
          }`}
          title="Show App Icon on Phone Home Screen"
        >
          <Home className="w-3 h-3" />
          <span>Home Screen</span>
        </button>

        <button
          onClick={() => setViewState('in_app')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
            viewState === 'in_app'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold shadow-xs'
              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
          }`}
          title="Show In-App WebView"
        >
          <Smartphone className="w-3 h-3" />
          <span>In-App</span>
        </button>

        <div className="w-px h-3.5 bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Engine mode toggle */}
        <button
          onClick={() => {
            setPreviewMode((m) => (m === 'proxy' ? 'direct' : 'proxy'));
            setIsLoading(true);
            setIframeKey((k) => k + 1);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px]"
          title="Toggle WebView Proxy mode (bypasses X-Frame-Options headers)"
        >
          <Layers className="w-3 h-3 text-emerald-500" />
          <span>{previewMode === 'proxy' ? 'Proxy' : 'Direct'}</span>
        </button>

        <button
          onClick={() => setOrientation(isLandscape ? 'portrait' : 'landscape')}
          className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white px-1.5 py-1"
          title="Rotate Orientation"
        >
          <RotateCw className="w-3 h-3" />
        </button>

        <button
          onClick={handleRefresh}
          className="hover:text-neutral-900 dark:hover:text-white p-1"
          title="Reload Preview"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={handleSplashDemo}
          className="hover:text-neutral-900 dark:hover:text-white px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px]"
          title="Preview Native Splash Screen"
        >
          Splash
        </button>
      </div>

      {/* Phone Hardware Mockup */}
      <div
        className={`relative transition-all duration-300 ease-out bg-neutral-950 rounded-[44px] p-2.5 shadow-2xl border-4 border-neutral-800 dark:border-neutral-700 ${
          isLandscape ? 'w-[640px] h-[360px]' : 'w-[320px] sm:w-[360px] h-[680px]'
        }`}
      >
        {/* Screen Bezel */}
        <div className="relative w-full h-full bg-white dark:bg-neutral-950 rounded-[34px] overflow-hidden flex flex-col shadow-inner">
          {/* Status Bar */}
          <div
            className="flex items-center justify-between px-5 pt-2.5 pb-1 text-xs select-none z-20 shrink-0 transition-colors"
            style={{
              backgroundColor:
                viewState === 'home_screen'
                  ? 'transparent'
                  : effectiveThemeColor,
              color: viewState === 'home_screen' ? '#ffffff' : headerTextColor,
            }}
          >
            <span className="font-semibold text-[11px] tracking-tight">9:41</span>

            {/* Dynamic Island or Camera Punch Hole */}
            {device === 'ios' && !isLandscape && (
              <div className="w-20 h-3.5 bg-black rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-900" />
              </div>
            )}
            {device === 'android' && !isLandscape && (
              <div className="w-2.5 h-2.5 bg-black rounded-full mx-auto" />
            )}

            <div className="flex items-center gap-1.5 opacity-90 text-[10px]">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* MAIN SCREEN AREA */}
          {viewState === 'home_screen' ? (
            /* ========================================================================= */
            /* HOME SCREEN LAUNCHER MODE (App Icon displayed on phone home screen)      */
            /* ========================================================================= */
            <div className="relative flex-1 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 text-white flex flex-col justify-between p-4 select-none overflow-hidden">
              {/* Wallpaper Ambient Glow */}
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ backgroundColor: effectiveThemeColor }}
              />

              {/* Time & Weather Widget */}
              <div className="relative z-10 pt-1 text-center space-y-0.5">
                <div className="text-3xl font-light tracking-tight">09:41</div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-neutral-300">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thursday, Sep 20 • 72°F</span>
                </div>
              </div>

              {/* Home Screen App Grid */}
              <div className="relative z-10 grid grid-cols-4 gap-y-4 gap-x-2 my-auto px-1">
                {/* 1. PRIMARY TARGET APP: USER'S GENERATED APP */}
                <div
                  onClick={handleLaunchApp}
                  className="flex flex-col items-center gap-1 group cursor-pointer active:scale-95 transition-transform"
                  title="Tap to launch your app"
                >
                  <div className="relative">
                    {renderAppIcon(
                      'w-13 h-13 sm:w-14 sm:h-14',
                      'text-xl font-bold',
                      device === 'ios' ? 'rounded-[16px]' : 'rounded-2xl'
                    )}
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-neutral-950 animate-pulse">
                      NEW
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-white tracking-tight truncate max-w-[64px] text-center drop-shadow-md">
                    {appDisplayName}
                  </span>
                </div>

                {/* System Apps to create a realistic home screen */}
                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-400 flex items-center justify-center text-white shadow-sm">
                    <Calendar className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Calendar</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center text-white shadow-sm">
                    <Camera className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Camera</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center text-white shadow-sm">
                    <Mail className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Mail</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                    <Music className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Music</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
                    <Compass className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Maps</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-neutral-600 to-neutral-500 flex items-center justify-center text-white shadow-sm">
                    <Settings className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Settings</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                    <MessageSquare className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] text-neutral-300 font-medium tracking-tight">Messages</span>
                </div>
              </div>

              {/* Package ID & Theme live badge on Home Screen */}
              <div className="relative z-10 flex flex-col items-center gap-1 py-1">
                <div className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-700/60 text-[10px] text-neutral-300 backdrop-blur-md flex items-center gap-1.5 shadow-sm max-w-[270px] truncate">
                  <Package className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-mono truncate">{activePackageId}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: effectiveThemeColor }}
                    title={`Theme: ${effectiveThemeColor}`}
                  />
                </div>

                <button
                  onClick={handleLaunchApp}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] text-white/90 transition backdrop-blur-sm inline-flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Tap {appDisplayName} to launch</span>
                </button>
              </div>

              {/* Bottom App Dock */}
              <div className="relative z-10 bg-white/10 dark:bg-neutral-800/40 backdrop-blur-md rounded-3xl p-2.5 flex items-center justify-around border border-white/10 shadow-lg mt-1">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                  <Phone className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-xs">
                  <Compass className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-xs">
                  <MessageSquare className="w-5 h-5 stroke-[2]" />
                </div>
                <div
                  onClick={handleLaunchApp}
                  className="w-11 h-11 rounded-xl cursor-pointer active:scale-95 transition-transform overflow-hidden shadow-xs"
                  title={`Launch ${appDisplayName}`}
                >
                  {renderAppIcon('w-11 h-11', 'text-sm font-bold', 'rounded-xl')}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* IN-APP WEBVIEW MODE                                                      */
            /* ========================================================================= */
            <>
              {/* Mobile In-App Browser Bar */}
              <div
                className="flex items-center justify-between px-3 py-1.5 border-b border-black/10 dark:border-white/10 select-none z-10 shrink-0 transition-colors"
                style={{
                  backgroundColor: effectiveThemeColor,
                  color: headerTextColor,
                }}
              >
                {/* App title and logo */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                  {renderAppIcon('w-4 h-4', 'text-[9px] font-bold', 'rounded-[4px]')}
                  <span
                    className="text-[11px] font-semibold truncate tracking-tight"
                    style={{ color: headerTextColor }}
                  >
                    {appDisplayName}
                  </span>
                </div>

                {/* URL pill */}
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] max-w-[140px] truncate border ${
                    isLightHeader
                      ? 'bg-black/10 text-neutral-800 border-black/15'
                      : 'bg-black/30 text-white/90 border-white/15'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{displayHost}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 ml-1.5">
                  <button
                    onClick={() => setShowInfoModal((v) => !v)}
                    className="p-1 opacity-80 hover:opacity-100 transition"
                    style={{ color: headerTextColor }}
                    title="View App Identity & Config"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setViewState('home_screen')}
                    className="p-1 opacity-80 hover:opacity-100 transition"
                    style={{ color: headerTextColor }}
                    title="Return to Home Screen"
                  >
                    <Home className="w-3 h-3" />
                  </button>
                  {activeUrl && (
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 opacity-80 hover:opacity-100 transition"
                      style={{ color: headerTextColor }}
                      title="Open live site in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={handleRefresh}
                    className="p-1 opacity-80 hover:opacity-100 transition"
                    style={{ color: headerTextColor }}
                    title="Reload WebView"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Live Info Sheet Overlay */}
              {showInfoModal && (
                <div className="bg-neutral-900 text-white px-3.5 py-2.5 text-xs border-b border-neutral-800 space-y-1 z-30 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between font-semibold text-[11px] text-neutral-200">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-emerald-400" />
                      <span>App Identity</span>
                    </span>
                    <button
                      onClick={() => setShowInfoModal(false)}
                      className="text-neutral-400 hover:text-white text-[10px]"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-300 font-mono">
                    <div>
                      <span className="text-neutral-500 block">Package ID:</span>
                      <span className="truncate block">{activePackageId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Theme Color:</span>
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: effectiveThemeColor }}
                        />
                        {effectiveThemeColor}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading Progress Bar */}
              {isLoading && (
                <div className="w-full h-0.5 bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0 z-30">
                  <div className="h-full bg-emerald-500 animate-pulse w-full" />
                </div>
              )}

              {/* Screen Content / WebView iframe */}
              <div className="relative flex-1 bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
                {/* Splash Screen Overlay Demo */}
                {showSplash && (
                  <div
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center transition-opacity animate-in fade-in"
                    style={{ backgroundColor: config.splashBackgroundColor || '#0A0A0A' }}
                  >
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xl mb-3 overflow-hidden p-2">
                      {renderAppIcon('w-16 h-16', 'text-2xl font-bold', 'rounded-2xl')}
                    </div>
                    <div className="text-base font-bold text-white tracking-wide">
                      {appDisplayName}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Loading native container...</span>
                    </div>
                  </div>
                )}

                {/* Simulated Pull to Refresh Indicator */}
                {isLoading && config.pullToRefresh && (
                  <div className="absolute top-2 inset-x-0 flex justify-center z-10 pointer-events-none">
                    <div className="bg-white dark:bg-neutral-800 rounded-full px-2.5 py-1 shadow-md flex items-center gap-1.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-neutral-900 dark:text-white" />
                      <span>Updating WebView...</span>
                    </div>
                  </div>
                )}

                {activeUrl ? (
                  <iframe
                    key={iframeKey}
                    src={computedSrc}
                    title="Website Mobile WebView Preview"
                    className="w-full h-full border-0 select-none bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                      <Smartphone className="w-6 h-6 stroke-1.5 text-neutral-500" />
                    </div>
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Ready to preview
                    </p>
                    <p className="text-[11px] text-neutral-400 max-w-[200px] mb-4">
                      Enter any website URL in Step 1 to load real-time mobile WebView rendering.
                    </p>

                    {/* Quick samples to try */}
                    <div className="flex flex-col gap-1.5 w-full max-w-[220px]">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        Quick test links:
                      </span>
                      <button
                        onClick={() => setActiveUrl('https://en.m.wikipedia.org')}
                        className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                      >
                        📖 Wikipedia Mobile
                      </button>
                      <button
                        onClick={() => setActiveUrl('https://news.ycombinator.com')}
                        className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition"
                      >
                        📰 Hacker News
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Native Navigation Simulation (if enabled) */}
              {config.bottomNavigation && (
                <div className="flex items-center justify-around py-1.5 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs z-10 shrink-0">
                  <button
                    onClick={() => {
                      try {
                        const iframe = document.querySelector('iframe');
                        iframe?.contentWindow?.history.back();
                      } catch {
                        /* safe */
                      }
                    }}
                    className="p-1 hover:text-neutral-900 dark:hover:text-white"
                    title="Back"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const iframe = document.querySelector('iframe');
                        iframe?.contentWindow?.history.forward();
                      } catch {
                        /* safe */
                      }
                    }}
                    className="p-1 hover:text-neutral-900 dark:hover:text-white"
                    title="Forward"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewState('home_screen')}
                    className="p-1 hover:text-neutral-900 dark:hover:text-white"
                    title="Home"
                  >
                    <Home className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="p-1 hover:text-neutral-900 dark:hover:text-white"
                    title="Reload"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Home indicator bar (iOS & Android) */}
          <div
            onClick={() => setViewState((s) => (s === 'home_screen' ? 'in_app' : 'home_screen'))}
            className="h-4 bg-white dark:bg-neutral-950 flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition"
            title="Tap to toggle Home Screen / In-App"
          >
            <div className="w-24 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-2">
        <Sparkles className="w-3 h-3 text-emerald-500" />
        <span>
          {viewState === 'home_screen'
            ? 'Home Screen Icon Preview • Tap icon to launch app'
            : previewMode === 'proxy'
            ? 'Bapp Mobile Proxy Engine (Headers & CORS Unlocked)'
            : 'Direct Web Frame'}
        </span>
      </div>
    </div>
  );
};

