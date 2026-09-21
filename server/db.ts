import { randomUUID } from 'crypto';
import type { Project, BuildJob, BuildArtifact, User, ProjectConfig, WebsiteAnalysis } from '../src/types';

class DatabaseService {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private builds: Map<string, BuildJob> = new Map();
  private artifacts: Map<string, { buffer: Buffer; meta: BuildArtifact }> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const demoUser: User = {
      id: 'usr_demo_1',
      email: 'developer@bapp.dev',
      name: 'Mobile Architect',
      plan: 'pro',
      buildsUsedThisMonth: 0,
      buildsLimit: 50,
    };
    this.users.set(demoUser.id, demoUser);
  }

  // Users
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getDefaultUser(): User {
    return Array.from(this.users.values())[0];
  }

  // Projects
  getProjects(userId?: string): Project[] {
    const all = Array.from(this.projects.values());
    if (userId) {
      return all.filter((p) => p.userId === userId);
    }
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  createProject(data: {
    userId: string;
    name: string;
    websiteUrl: string;
    config?: Partial<ProjectConfig>;
    analysis?: WebsiteAnalysis;
    targetPlatform?: 'android' | 'ios' | 'both';
  }): Project {
    const id = `proj_${randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    const sanitizedName = data.name.trim() || 'My App';
    const domain = data.websiteUrl ? new URL(data.websiteUrl).hostname.replace(/[^a-zA-Z0-9]/g, '') : 'myapp';
    const defaultPackage = `com.bapp.${domain.toLowerCase() || 'app'}`;

    const project: Project = {
      id,
      userId: data.userId,
      name: sanitizedName,
      websiteUrl: data.websiteUrl,
      targetPlatform: data.targetPlatform || 'both',
      analysis: data.analysis,
      createdAt: now,
      updatedAt: now,
      config: {
        appName: sanitizedName,
        packageId: data.config?.packageId || defaultPackage,
        bundleId: data.config?.bundleId || defaultPackage,
        versionName: data.config?.versionName || '1.0.0',
        versionCode: data.config?.versionCode || 1,
        themeColor: data.config?.themeColor || '#0A0A0A',
        backgroundColor: data.config?.backgroundColor || '#F7F7F5',
        orientation: data.config?.orientation || 'portrait',
        pullToRefresh: data.config?.pullToRefresh ?? true,
        swipeNavigation: data.config?.swipeNavigation ?? true,
        bottomNavigation: data.config?.bottomNavigation ?? false,
        backButtonBehavior: data.config?.backButtonBehavior || 'history',
        externalLinksBehavior: data.config?.externalLinksBehavior || 'external_browser',
        allowedDomains: data.config?.allowedDomains || [new URL(data.websiteUrl).hostname],
        enableCamera: data.config?.enableCamera ?? false,
        cameraPermissionReason: data.config?.cameraPermissionReason || 'Required for capturing profile pictures and document scans',
        enableLocation: data.config?.enableLocation ?? false,
        locationPermissionReason: data.config?.locationPermissionReason || 'Used to deliver location-specific services',
        enableFileUpload: data.config?.enableFileUpload ?? true,
        enableNotifications: data.config?.enableNotifications ?? false,
        splashBackgroundColor: data.config?.splashBackgroundColor || '#0A0A0A',
        enableDomStorage: data.config?.enableDomStorage ?? true,
        enableJavaScript: data.config?.enableJavaScript ?? true,
        clearCacheOnExit: data.config?.clearCacheOnExit ?? false,
        ...data.config,
      },
    };

    this.projects.set(id, project);
    return project;
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    const updated: Project = {
      ...existing,
      ...updates,
      config: {
        ...existing.config,
        ...(updates.config || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  // Builds
  getBuild(id: string): BuildJob | undefined {
    return this.builds.get(id);
  }

  getBuildsForProject(projectId: string): BuildJob[] {
    return Array.from(this.builds.values())
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  getAllBuilds(): BuildJob[] {
    return Array.from(this.builds.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  saveBuild(build: BuildJob): void {
    this.builds.set(build.id, build);
  }

  // Artifacts
  saveArtifact(artifact: BuildArtifact, buffer: Buffer): void {
    this.artifacts.set(artifact.id, { buffer, meta: artifact });
  }

  getArtifact(id: string): { buffer: Buffer; meta: BuildArtifact } | undefined {
    return this.artifacts.get(id);
  }
}

export const db = new DatabaseService();
