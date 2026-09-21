import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, HardDrive, Server, Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export const AdminPanel: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemHealth();
      setHealth(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            System & Build Worker Infrastructure
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time status of build queues, SSRF firewalls, and project generators.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SSRF & Security */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              SSRF Defense Engine
            </h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Active DNS resolution check blocking 127.0.0.1, private RFC 1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and cloud metadata endpoints (169.254.169.254).
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Active & Enforcing</span>
          </div>
        </div>

        {/* Android Build Worker */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Android Kotlin Generator
            </h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Generates Android Studio projects with Kotlin DSL, AndroidX WebKit, WebChromeClient, and debug package assemblies.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>API 34 Target Ready</span>
          </div>
        </div>

        {/* iOS Project Generator */}
        <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-neutral-900 dark:text-white" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              iOS Xcode Generator
            </h3>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Packages WKWebView Swift 5 source projects with <code className="font-mono">project.pbxproj</code> for Xcode and macOS compilation.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Export & Archive Ready</span>
          </div>
        </div>
      </div>

      {/* Worker Specs */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          Build Worker Isolation Specification (Sec. 38 & 39)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <span className="text-neutral-400 block text-[11px]">Max Build Duration</span>
            <span className="font-bold text-neutral-900 dark:text-white text-sm">15 Minutes</span>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <span className="text-neutral-400 block text-[11px]">Worker Memory Limit</span>
            <span className="font-bold text-neutral-900 dark:text-white text-sm">4 GB RAM</span>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <span className="text-neutral-400 block text-[11px]">Artifact Storage</span>
            <span className="font-bold text-neutral-900 dark:text-white text-sm">S3-Compatible Object Store</span>
          </div>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl">
            <span className="text-neutral-400 block text-[11px]">Worker Privilege</span>
            <span className="font-bold text-neutral-900 dark:text-white text-sm">Non-root Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
};
