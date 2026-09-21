import React, { useState } from 'react';
import { Step01Website } from './Step01Website';
import { Step02Configure } from './Step02Configure';
import { Step03Permissions } from './Step03Permissions';
import { Step04Build } from './Step04Build';
import { Step05Download } from './Step05Download';
import { PhonePreview } from '../PhonePreview';
import type { WebsiteAnalysis, ProjectConfig, Platform, Project, BuildJob } from '../../types';
import { api } from '../../lib/api';

interface WizardContainerProps {
  initialUrl?: string;
  onFinish: () => void;
  onCancel: () => void;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  initialUrl = '',
  onFinish,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [url, setUrl] = useState<string>(initialUrl);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<Platform>('both');
  const [activeBuild, setActiveBuild] = useState<BuildJob | null>(null);

  const [config, setConfig] = useState<ProjectConfig>({
    appName: '',
    packageId: 'com.example.bappdemo',
    bundleId: 'com.example.bappdemo',
    versionName: '1.0.0',
    versionCode: 1,
    themeColor: '#0A0A0A',
    backgroundColor: '#F7F7F5',
    orientation: 'portrait',
    pullToRefresh: true,
    swipeNavigation: true,
    bottomNavigation: false,
    backButtonBehavior: 'history',
    externalLinksBehavior: 'external_browser',
    allowedDomains: [],
    enableCamera: false,
    cameraPermissionReason: 'Required for taking and uploading profile or document photos',
    enableLocation: false,
    locationPermissionReason: 'Used to provide location-specific features',
    enableFileUpload: true,
    enableNotifications: false,
    splashBackgroundColor: '#0A0A0A',
    enableDomStorage: true,
    enableJavaScript: true,
    clearCacheOnExit: false,
  });

  // When analysis completes, initialize config with extracted title & theme
  const handleSetAnalysis = (res: WebsiteAnalysis | null) => {
    setAnalysis(res);
    if (res) {
      const hostname = new URL(res.url).hostname;
      const cleanHost = hostname.replace(/^www\./, '').replace(/[^a-zA-Z0-9]/g, '');
      const defaultPackage = `com.bapp.${cleanHost.toLowerCase() || 'app'}`;

      setConfig((prev) => ({
        ...prev,
        appName: res.title ? res.title.substring(0, 32) : cleanHost,
        packageId: defaultPackage,
        bundleId: defaultPackage,
        allowedDomains: [hostname],
        themeColor: res.themeColor || prev.themeColor,
        iconUrl: res.faviconBase64 || res.faviconUrl || prev.iconUrl,
        iconBase64: res.faviconBase64 || prev.iconBase64,
        enableCamera: res.detectedFeatures.camera,
        enableLocation: res.detectedFeatures.location,
        enableFileUpload: res.detectedFeatures.fileUpload,
      }));
    }
  };

  // Step 1 -> Step 2
  const handleNextFromStep1 = async () => {
    try {
      let created = project;
      if (!created) {
        created = await api.createProject({
          name: config.appName || (analysis?.title ? analysis.title.substring(0, 30) : 'My App'),
          websiteUrl: url,
          config,
          analysis: analysis || undefined,
          targetPlatform,
        });
        setProject(created);
      }
      setCurrentStep(2);
    } catch (err) {
      console.error('Failed to create project record:', err);
      setCurrentStep(2);
    }
  };

  // Step 2 -> Step 3
  const handleNextFromStep2 = async () => {
    if (project) {
      try {
        const updated = await api.updateProject(project.id, {
          name: config.appName,
          config,
        });
        setProject(updated);
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentStep(3);
  };

  // Step 3 -> Step 4
  const handleNextFromStep3 = async () => {
    if (project) {
      try {
        const updated = await api.updateProject(project.id, {
          config,
          targetPlatform,
        });
        setProject(updated);
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentStep(4);
  };

  const steps = [
    { number: '01', title: 'Website' },
    { number: '02', title: 'Configure' },
    { number: '03', title: 'Permissions' },
    { number: '04', title: 'Build' },
    { number: '05', title: 'Download' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Wizard Header Bar & Step Indicator */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            App Builder Wizard
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">
            {project?.name || config.appName || 'New Application'}
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto py-1">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;

            return (
              <div
                key={step.number}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition select-none ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-sm'
                    : isDone
                    ? 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    : 'text-neutral-400 dark:text-neutral-600'
                }`}
              >
                <span>{step.number}</span>
                <span className="hidden sm:inline font-sans">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Content Layout with Live Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Center Form Area */}
        <div className="lg:col-span-7 xl:col-span-8">
          {currentStep === 1 && (
            <Step01Website
              url={url}
              setUrl={setUrl}
              analysis={analysis}
              setAnalysis={handleSetAnalysis}
              onNext={handleNextFromStep1}
            />
          )}

          {currentStep === 2 && (
            <Step02Configure
              config={config}
              setConfig={setConfig}
              favicon={analysis?.faviconBase64 || analysis?.faviconUrl}
              onNext={handleNextFromStep2}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step03Permissions
              config={config}
              setConfig={setConfig}
              onNext={handleNextFromStep3}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step04Build
              projectId={project?.id || null}
              config={config}
              targetPlatform={targetPlatform}
              setTargetPlatform={setTargetPlatform}
              activeBuild={activeBuild}
              setActiveBuild={setActiveBuild}
              onNext={() => setCurrentStep(5)}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <Step05Download
              project={project}
              build={activeBuild}
              onGoToDashboard={onFinish}
              onStartNewApp={() => {
                setUrl('');
                setAnalysis(null);
                setProject(null);
                setActiveBuild(null);
                setCurrentStep(1);
              }}
            />
          )}
        </div>

        {/* Right Live Phone Preview Area */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
          <PhonePreview
            url={url}
            config={config}
            title={analysis?.title}
            favicon={analysis?.faviconUrl}
          />
        </div>
      </div>
    </div>
  );
};
