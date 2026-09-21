import type { Project, BuildJob, WebsiteAnalysis, Platform, ProjectConfig } from '../types';

export const api = {
  async analyzeUrl(url: string): Promise<WebsiteAnalysis> {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to analyze website');
    return data.analysis;
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch projects');
    return data.projects;
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch project');
    return data.project;
  },

  async createProject(payload: {
    name: string;
    websiteUrl: string;
    config?: Partial<ProjectConfig>;
    analysis?: WebsiteAnalysis;
    targetPlatform?: Platform;
  }): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create project');
    return data.project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update project');
    return data.project;
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  async startBuild(projectId: string, platform?: Platform): Promise<BuildJob> {
    const res = await fetch(`/api/projects/${projectId}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to trigger build');
    return data.build;
  },

  async getBuild(buildId: string): Promise<BuildJob> {
    const res = await fetch(`/api/builds/${buildId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch build status');
    return data.build;
  },

  async getBuildLogs(buildId: string) {
    const res = await fetch(`/api/builds/${buildId}/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch build logs');
    return data;
  },

  async cancelBuild(buildId: string): Promise<void> {
    const res = await fetch(`/api/builds/${buildId}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to cancel build');
  },

  async getSystemHealth() {
    const res = await fetch('/api/system/health');
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    return data.user;
  },
};
