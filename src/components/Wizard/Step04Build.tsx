import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, Terminal, CheckCircle2, Circle, AlertCircle, Loader2, StopCircle, Copy, Check } from 'lucide-react';
import type { Platform, BuildJob, ProjectConfig } from '../../types';
import { api } from '../../lib/api';

interface Step04BuildProps {
  projectId: string | null;
  config: ProjectConfig;
  targetPlatform: Platform;
  setTargetPlatform: (p: Platform) => void;
  activeBuild: BuildJob | null;
  setActiveBuild: (b: BuildJob | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step04Build: React.FC<Step04BuildProps> = ({
  projectId,
  config,
  targetPlatform,
  setTargetPlatform,
  activeBuild,
  setActiveBuild,
  onNext,
  onBack,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Poll for build progress if activeBuild is ongoing
  useEffect(() => {
    if (!activeBuild || activeBuild.status === 'COMPLETED' || activeBuild.status === 'FAILED' || activeBuild.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await api.getBuild(activeBuild.id);
        setActiveBuild(updated);

        if (updated.status === 'COMPLETED') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling build:', err);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [activeBuild?.id, activeBuild?.status, setActiveBuild]);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeBuild?.logs.length) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeBuild?.logs.length]);

  const handleStartBuild = async () => {
    if (!projectId) return;
    setIsStarting(true);
    try {
      const build = await api.startBuild(projectId, targetPlatform);
      setActiveBuild(build);
    } catch (err) {
      console.error('Failed to trigger build:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelBuild = async () => {
    if (!activeBuild) return;
    try {
      await api.cancelBuild(activeBuild.id);
      const updated = await api.getBuild(activeBuild.id);
      setActiveBuild(updated);
    } catch (err) {
      console.error('Failed to cancel build:', err);
    }
  };

  const handleCopyLogs = () => {
    if (!activeBuild) return;
    const text = activeBuild.logs.map((l) => `[${l.timestamp}] [${l.step.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step milestone indicators
  const buildSteps = [
    { label: 'Website analyzed', key: 'analyze', minProgress: 30 },
    { label: 'Native project generated', key: 'generate', minProgress: 50 },
    { label: 'Platform SDK compilation', key: 'build', minProgress: 75 },
    { label: 'Keystore signing', key: 'sign', minProgress: 88 },
    { label: 'Upload artifacts', key: 'upload', minProgress: 95 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Generate & Build Packages
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Select target platforms and generate native Android Kotlin & iOS Xcode project archives.
        </p>
      </div>

      {/* Platform Selector */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4">
        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">
          Target Platform
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'both', label: 'Android + iOS', desc: 'Full cross-platform bundle' },
            { id: 'android', label: 'Android Only', desc: 'APK, AAB & Kotlin project' },
            { id: 'ios', label: 'iOS Only', desc: 'Xcode project & WKWebView' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(activeBuild && activeBuild.status !== 'COMPLETED' && activeBuild.status !== 'FAILED')}
              onClick={() => setTargetPlatform(item.id as Platform)}
              className={`p-4 rounded-2xl text-left border transition cursor-pointer ${
                targetPlatform === item.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm font-semibold'
                  : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
              }`}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className="text-[11px] opacity-75 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Build Trigger & Progress Card */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Build Engine & Execution
            </h3>
            <p className="text-xs text-neutral-500">
              {activeBuild ? `Job ID: ${activeBuild.id} • ${activeBuild.workerId}` : 'Ready to compile project artifacts'}
            </p>
          </div>

          {!activeBuild || activeBuild.status === 'COMPLETED' || activeBuild.status === 'FAILED' || activeBuild.status === 'CANCELLED' ? (
            <button
              type="button"
              onClick={handleStartBuild}
              disabled={isStarting}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{activeBuild?.status === 'COMPLETED' ? 'Rebuild Project' : 'Start Build'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelBuild}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* Milestone Steps Bar */}
        {activeBuild && (
          <div className="space-y-4 pt-2">
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-neutral-900 dark:bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${activeBuild.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {buildSteps.map((step, idx) => {
                const isDone = activeBuild.progress >= step.minProgress || activeBuild.status === 'COMPLETED';
                const isCurrent =
                  activeBuild.progress < step.minProgress &&
                  (idx === 0 || activeBuild.progress >= buildSteps[idx - 1].minProgress) &&
                  activeBuild.status !== 'FAILED';

                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-1.5 text-xs p-2 rounded-xl border ${
                      isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                        : isCurrent
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700 font-semibold'
                        : 'text-neutral-400 dark:text-neutral-600 border-transparent'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-900 dark:text-white flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                    )}
                    <span className="truncate text-[11px]">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Terminal Logs Window */}
        {activeBuild && (
          <div className="rounded-2xl bg-neutral-950 text-neutral-200 border border-neutral-800 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[11px] text-neutral-300 font-semibold">Build Output Stream</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                  {activeBuild.status}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLogs}
                className="hover:text-white text-neutral-400 flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4 h-56 overflow-y-auto space-y-1 select-text">
              {activeBuild.logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-neutral-500 text-[10px] select-none">{log.timestamp}</span>
                  <span
                    className={`text-[10px] uppercase font-bold select-none px-1 rounded ${
                      log.level === 'error'
                        ? 'bg-red-950 text-red-400'
                        : log.level === 'warn'
                        ? 'bg-amber-950 text-amber-400'
                        : log.level === 'success'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {log.step}
                  </span>
                  <span
                    className={`flex-1 break-all ${
                      log.level === 'error'
                        ? 'text-red-300'
                        : log.level === 'success'
                        ? 'text-emerald-300'
                        : 'text-neutral-300'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        )}
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

        {activeBuild?.status === 'COMPLETED' ? (
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Proceed to Download Artifacts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!activeBuild}
            className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40"
          >
            <span>Skip to Download</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
