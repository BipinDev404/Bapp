import React, { useState } from 'react';
import { Globe, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Sparkles, Smartphone, ShieldAlert } from 'lucide-react';
import type { WebsiteAnalysis } from '../../types';
import { api } from '../../lib/api';

interface Step01WebsiteProps {
  url: string;
  setUrl: (url: string) => void;
  analysis: WebsiteAnalysis | null;
  setAnalysis: (analysis: WebsiteAnalysis | null) => void;
  onNext: () => void;
}

export const Step01Website: React.FC<Step01WebsiteProps> = ({
  url,
  setUrl,
  analysis,
  setAnalysis,
  onNext,
}) => {
  const [hasPermission, setHasPermission] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a website URL');
      return;
    }
    if (!hasPermission) {
      setError('You must confirm you have permission to package this website.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.analyzeUrl(url);
      setAnalysis(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Enter your website URL
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Bapp will safely inspect your website structure, responsive viewports, HTTPS, and PWA manifests.
        </p>
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
            <Globe className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://yourwebsite.com"
            disabled={isLoading}
            className="w-full pl-11 pr-32 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl text-neutral-900 dark:text-white text-base placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition shadow-sm font-mono text-sm"
          />
          <div className="absolute inset-y-1.5 right-1.5 flex items-center">
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="h-full px-5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Permission Confirmation */}
        <label className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={hasPermission}
            onChange={(e) => setHasPermission(e.target.checked)}
            className="mt-0.5 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0"
          />
          <span>
            I confirm that I have permission to package this website into a mobile application.
          </span>
        </label>

        {/* Quick demo presets */}
        <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
          <span>Try an example:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://example.com')}
            className="text-neutral-900 dark:text-neutral-300 underline underline-offset-2 hover:text-black dark:hover:text-white"
          >
            example.com
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('https://news.ycombinator.com')}
            className="text-neutral-900 dark:text-neutral-300 underline underline-offset-2 hover:text-black dark:hover:text-white"
          >
            news.ycombinator.com
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-xs tracking-wide uppercase">Website Security & Verification</p>
            <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Results Card */}
      {analysis && (
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {analysis.faviconUrl ? (
                <img
                  src={analysis.faviconUrl}
                  alt="Favicon"
                  className="w-10 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1 object-cover bg-white"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300">
                  {analysis.title.substring(0, 1) || 'W'}
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  {analysis.title || 'Untitled Website'}
                </h3>
                <p className="text-xs text-neutral-500 font-mono">{analysis.url}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready to Package
            </span>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 block">HTTPS Protocol</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                {analysis.isHttps ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Secure SSL
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Cleartext HTTP
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 block">Responsive Viewport</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                {analysis.isResponsive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mobile Optimized
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Desktop Scale
                  </>
                )}
              </span>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 block">PWA Manifest</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                {analysis.hasManifest ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Manifest Found
                  </>
                ) : (
                  <span className="text-neutral-400">None detected</span>
                )}
              </span>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/60 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-500 block">Service Worker</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                {analysis.hasServiceWorker ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Offline Ready
                  </>
                ) : (
                  <span className="text-neutral-400">Standard Web</span>
                )}
              </span>
            </div>
          </div>

          {/* Compatibility Advice */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Web Compatibility</p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white">{analysis.compatibility.score}%</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                {analysis.compatibility.overall === 'good' ? 'Good' : 'Needs configuration'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(analysis.compatibility.features).filter(([, feature]) => feature.detected).map(([name, feature]) => (
                <div key={name} className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs font-medium capitalize text-neutral-800 dark:text-neutral-200">{name.replace(/[A-Z]/g, (letter) => ` ${letter}`)}</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">{feature.status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
            {analysis.compatibility.deductions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Why the score changed</p>
                <ul className="mt-1 list-disc list-inside text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                  {analysis.compatibility.deductions.map((deduction, index) => <li key={index}>{deduction}</li>)}
                </ul>
              </div>
            )}
          </div>

          {analysis.compatibility.recommendations.length > 0 && (
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Compatibility & Native Suggestions</span>
              </div>
              <ul className="list-disc list-inside text-neutral-600 dark:text-neutral-400 space-y-1 pl-1">
                {analysis.compatibility.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Continue to Configuration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
