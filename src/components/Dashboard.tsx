import React, { useState, useEffect } from 'react';
import { Plus, Smartphone, Apple, Play, Download, Trash2, ExternalLink, Terminal, Shield, RefreshCw, Loader2, Layers, CheckCircle2, Clock, Package } from 'lucide-react';
import type { Project, BuildJob, User } from '../types';
import { api } from '../lib/api';
import { downloadArtifactSafe } from '../utils/downloadArtifact';

interface DashboardProps {
  onCreateNew: () => void;
  onOpenProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateNew, onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBuildLogs, setSelectedBuildLogs] = useState<BuildJob | null>(null);
  const [buildingProjectId, setBuildingProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const [projectsData, userData] = await Promise.all([
        api.getProjects(),
        api.getCurrentUser().catch(() => null),
      ]);
      setProjects(projectsData);
      if (userData) setUser(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleQuickBuild = async (project: Project) => {
    setBuildingProjectId(project.id);
    try {
      const build = await api.startBuild(project.id, project.targetPlatform);
      setSelectedBuildLogs(build);
      await fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setBuildingProjectId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Project Dashboard
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your mobile app wrappers, trigger automated builds, and download native source packages.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Usage Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <span className="text-xs text-neutral-500 font-medium">Total Applications</span>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {projects.length}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Active web-to-mobile projects</span>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <span className="text-xs text-neutral-500 font-medium">Monthly Build Usage</span>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
            {user ? user.buildsUsedThisMonth : 0} <span className="text-sm font-normal text-neutral-400">/ {user ? user.buildsLimit : 50} builds</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            Pro Plan Active
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <span className="text-xs text-neutral-500 font-medium">Build Engine Status</span>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base">Operational</span>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Android SDK 34 • Xcode 15</span>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          Applications ({projects.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-neutral-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
              <Layers className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              You haven't created an app yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Package your first responsive website into an Android APK or iOS Xcode project.
            </p>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Create your first app
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-700 transition space-y-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-neutral-800 dark:text-neutral-200 text-sm overflow-hidden">
                        {project.config.iconUrl ? (
                          <img
                            src={project.config.iconUrl}
                            alt="App Icon"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          project.name.substring(0, 1)
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate max-w-[170px]">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-neutral-400 font-mono truncate max-w-[170px]">
                          {project.config.packageId}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="truncate">{project.websiteUrl}</span>
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-neutral-900 dark:hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px]">
                    <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      Android
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
                      <Apple className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                      iOS
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-700">•</span>
                    <span className="text-neutral-400">v{project.config.versionName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => handleQuickBuild(project)}
                    disabled={buildingProjectId === project.id}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {buildingProjectId === project.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>Build</span>
                  </button>

                  <button
                    onClick={() => onOpenProject(project)}
                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terminal Drawer for quick builds */}
      {selectedBuildLogs && (
        <div className="p-6 bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-3xl font-mono text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">Live Build Stream: {selectedBuildLogs.projectName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
                {selectedBuildLogs.status}
              </span>
            </div>
            <button
              onClick={() => setSelectedBuildLogs(null)}
              className="text-neutral-400 hover:text-white text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 bg-black/40 p-3 rounded-xl border border-neutral-900">
            {selectedBuildLogs.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <span className="text-neutral-500">{log.timestamp}</span>
                <span className="text-neutral-400 uppercase font-bold text-[10px]">[{log.step}]</span>
                <span className={log.level === 'error' ? 'text-red-400' : 'text-neutral-300'}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>

          {selectedBuildLogs.status === 'COMPLETED' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  downloadArtifactSafe(
                    `/api/artifacts/${selectedBuildLogs.id}/android-apk`,
                    `app-debug.apk`
                  )
                }
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Download APK (.apk)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadArtifactSafe(
                    `/api/artifacts/${selectedBuildLogs.id}/android-project`,
                    `android-project.zip`
                  )
                }
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Android ZIP</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadArtifactSafe(
                    `/api/artifacts/${selectedBuildLogs.id}/ios-project`,
                    `ios-project.zip`
                  )
                }
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download iOS ZIP</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
