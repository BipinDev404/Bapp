import React from 'react';
import { ArrowLeft, ArrowRight, Camera, MapPin, UploadCloud, Bell, ShieldCheck, Info } from 'lucide-react';
import type { ProjectConfig } from '../../types';

interface Step03PermissionsProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  onNext: () => void;
  onBack: () => void;
}

export const Step03Permissions: React.FC<Step03PermissionsProps> = ({
  config,
  setConfig,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
          Native Device Permissions
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Configure hardware and system permissions required by your web application.
        </p>
      </div>

      <div className="space-y-4">
        {/* File Uploads (WebChromeClient) */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white mt-0.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  File Uploads & Document Chooser
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Native Android <code className="text-xs font-mono">WebChromeClient.onShowFileChooser</code> and iOS file pickers for <code className="text-xs font-mono">&lt;input type="file"&gt;</code>.
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Supports Camera capture, Gallery photos, and PDF documents natively.</span>
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableFileUpload}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enableFileUpload: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-neutral-900"></div>
            </label>
          </div>
        </div>

        {/* Camera Permission */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white mt-0.5">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Camera Access
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Allows web apps to use <code className="text-xs font-mono">getUserMedia()</code> or take real-time photos.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableCamera}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enableCamera: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-neutral-900"></div>
            </label>
          </div>

          {config.enableCamera && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5 animate-in fade-in">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block uppercase tracking-wider">
                Apple Info.plist NSCameraUsageDescription
              </label>
              <input
                type="text"
                value={config.cameraPermissionReason}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, cameraPermissionReason: e.target.value }))
                }
                placeholder="This app requires access to your camera to capture and upload photos."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Location Permission */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Location & Geolocation
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Allows web apps to request user coordinates via <code className="text-xs font-mono">navigator.geolocation</code>.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableLocation}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enableLocation: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-neutral-900"></div>
            </label>
          </div>

          {config.enableLocation && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5 animate-in fade-in">
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block uppercase tracking-wider">
                Apple Info.plist NSLocationWhenInUseUsageDescription
              </label>
              <input
                type="text"
                value={config.locationPermissionReason}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, locationPermissionReason: e.target.value }))
                }
                placeholder="This app requires access to your location to provide personalized services."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Push Notifications
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Injects Android 13+ <code className="text-xs font-mono">POST_NOTIFICATIONS</code> runtime request and Apple APNs configuration headers.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableNotifications}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enableNotifications: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-neutral-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-neutral-900"></div>
            </label>
          </div>

          <div className="flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-500">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
            <span>
              Note: Android push notifications require Firebase Cloud Messaging (FCM) credentials, and iOS requires an Apple Push Notification service (APNs) key.
            </span>
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
          className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-2xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <span>Continue to Build</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
