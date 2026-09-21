# Bapp

Bapp turns a responsive website into downloadable Android and iOS wrapper projects. It provides a React/Vite interface, an Express API, website analysis, native permission configuration, Android APK generation, and Android Studio/Xcode project archives.

## Features

- Analyze a website's HTTPS status, responsive viewport, metadata, favicon, PWA manifest, service worker, and common browser features.
- Configure application name, package identifiers, versioning, theme colors, orientation, navigation behavior, and WebView settings.
- Configure camera, location, file upload, and notification capabilities.
- Generate Android Kotlin/Gradle projects and signed debug APKs.
- Generate iOS Swift/WKWebView Xcode projects and IPA archives.
- Download generated build artifacts from the dashboard.
- Validate requested websites against common SSRF targets and private network ranges.

## Technology

- React 19 and TypeScript
- Vite 8 with Tailwind CSS 4
- Express 4
- `tsx` for development execution
- `esbuild` for the production server bundle
- `sharp` for icon processing
- JSZip for native project archives
- Python 3 for APK template packing

## Requirements

- Node.js 22 or newer recommended
- npm
- Python 3.10 or newer for Android APK builds
- Internet access for website analysis and remote favicon downloads

Android Studio and Xcode are not required to run the Bapp web interface. Android Studio is needed to compile the downloaded Android project locally. Xcode on macOS is needed to compile and sign the downloaded iOS project.

## Installation

Open a terminal in the project directory:

```powershell
npm install
```

The repository includes the Android APK template at `server/templates/webview-base.apk`. Keep this file in place if you want APK builds to work.

## Development

Start the combined Express and Vite development server:

```powershell
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

The development server serves both the React frontend and backend API. The port is currently fixed to `3000` in `server.ts`.

Useful checks:

```powershell
# TypeScript validation
npm run lint

# Backend health endpoint
Invoke-WebRequest http://localhost:3000/api/system/health -UseBasicParsing
```

## Production Build

Build the frontend and bundle the Express server:

```powershell
npm run build
```

Start the production server:

```powershell
npm start
```

The production server serves the compiled frontend from `dist/` and listens on port `3000`.

## Deploy to Vercel

This repository includes `vercel.json` and `api/index.ts` so Vercel deploys the Express API as a serverless function alongside the Vite frontend.

From the project directory:

```powershell
npm install
npm run build
npx vercel
```

For a production deployment:

```powershell
npx vercel --prod
```

In the Vercel project settings, use these values if Vercel asks for them:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Do not deploy only the `dist` folder. The `api/index.ts` serverless function is required for `/api/analyze`, projects, builds, downloads, and the preview proxy. After deployment, verify:

```text
https://YOUR-DOMAIN.vercel.app/api/system/health
```

It should return JSON containing `"status":"operational"`. If the frontend receives an HTML page from an API URL, Vercel is serving the frontend fallback instead of the API function; check that `api/index.ts` and `vercel.json` are included in the deployed repository.

## Recommended Deployment: Render

Render is a better fit for the complete Bapp application because it runs the Express server as a persistent web service and can execute the Python APK packer. The repository includes `Dockerfile` and `render.yaml` for this deployment.

1. Push the repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render detects `render.yaml`, builds the Docker image, and creates the web service.
4. Open the generated Render URL and verify `/api/system/health` returns JSON.

The included Blueprint uses the `starter` plan because free services sleep and are not suitable for long-running build jobs. You can change the plan in Render if occasional sleeping and lost in-memory state are acceptable.

The Docker image installs Node.js and Python, preserves `server/templates/webview-base.apk`, and runs `npm start`. The service listens on Render's `PORT` environment variable.

## Application Workflow

1. Enter a public website URL and confirm that you have permission to package it.
2. Run the website analyzer.
3. Configure the application identity, appearance, navigation, and WebView behavior.
4. Enable the native permissions required by the website.
5. Select Android, iOS, or both and start a build.
6. Download the APK, IPA, Android project ZIP, or iOS project ZIP when the build completes.

## API Endpoints

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/auth/me` | Return the demo user |
| POST | `/api/auth/login` | Return the demo session |
| POST | `/api/auth/register` | Return the demo session |
| POST | `/api/auth/logout` | End the demo session |

### Websites and projects

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/analyze` | Analyze a website URL |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get a project |
| PATCH | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |
| POST | `/api/projects/:id/analyze` | Re-analyze a project website |

### Builds and artifacts

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/projects/:id/build` | Queue a build |
| GET | `/api/builds/:id` | Get build status and artifacts |
| GET | `/api/builds/:id/logs` | Get build logs |
| POST | `/api/builds/:id/cancel` | Cancel a build |
| GET | `/api/projects/:id/builds` | List project builds |
| GET | `/api/artifacts/:buildId/:type` | Download an artifact |
| GET | `/api/preview-proxy?url=...` | Load a validated website in the mobile preview |
| GET | `/api/system/health` | Check server health |

Artifact type aliases include `android-apk`, `android-project`, `ios-ipa`, and `ios-project`.

## Data and Limitations

- Data is stored in memory by `server/db.ts`; projects, builds, and artifacts are lost when the server restarts.
- Authentication is a demo implementation using one seeded user and a fixed demo token.
- The build queue runs in the Node.js process and is not durable or distributed.
- The server validates public website URLs and blocks localhost, private IP ranges, metadata endpoints, and non-standard ports.
- iOS source generation is available on any host, but native iOS compilation and signing require macOS and Xcode.
- The generated Android APK uses the included precompiled WebView template and the Python packer. A missing template or Python executable will make Android APK generation fail, although Android project ZIP generation can still be used.
- The generated artifacts are development/demo outputs. Store submission still requires platform-specific signing, certificates, store metadata, and policy compliance.

## Environment Variables

The current application does not require `GEMINI_API_KEY`, a database, Redis, S3, or Apple signing variables for local development. The values listed in `.env.example` are deployment-oriented placeholders and are not currently wired into the active server code.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the frontend and production server bundle |
| `npm start` | Start the production server from `dist/server.cjs` |
| `npm run lint` | Run TypeScript validation |
| `npm run preview` | Preview the Vite frontend only |
| `npm run clean` | Remove generated build output |

## Project Structure

```text
server.ts                    Express API and Vite server entrypoint
server/analyzer.ts           Website metadata and compatibility analyzer
server/security.ts           URL and package ID validation
server/db.ts                 In-memory data service
server/buildQueue.ts         In-process build queue
server/generators/            Android/iOS project and package generators
server/templates/             Precompiled Android WebView APK template
src/App.tsx                  React application shell
src/components/              Landing page, dashboard, preview, and wizard UI
src/lib/api.ts               Frontend API client
src/types.ts                 Shared TypeScript types
```

## Verification

Run these commands after setup:

```powershell
npm run lint
npm run build
npm run dev
```

Then visit `http://localhost:3000` and check `http://localhost:3000/api/system/health`.
