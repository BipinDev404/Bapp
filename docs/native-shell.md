# Bapp Native Shell

Bapp keeps the website as the application source of truth and generates a stable native shell around it:

`Website -> Native App Shell -> WebView -> Bapp Bridge -> Plugins -> Android/iOS APIs`

## Shared configuration

`server/shellConfig.ts` normalizes a project into `ShellConfig`. The same object drives the enabled plugin map, navigation allowlist, bridge version, permissions, and generated platform projects.

## Bridge

The generated shell exposes `window.bapp` and the optional `@bapp/bridge` SDK. The SDK is safe to import in an ordinary browser. Native-only calls reject when no Bapp transport exists, so websites can feature-detect with `Bapp.isApp()`.

## Plugins

Plugin metadata lives in `plugins/registry.ts`. Compatibility detection suggests modules; it does not grant permissions. Native permission prompts happen only when a website requests the corresponding capability.

## Build workers

The API server generates source projects only. Android APK/AAB compilation requires an isolated Linux Android worker with Gradle and signing credentials. iOS compilation requires an isolated macOS worker with Xcode and signing credentials. Until those workers are configured, Bapp must return downloadable Android Studio/Xcode projects and must not claim an APK, AAB, or IPA exists.

## Website overrides

`customJavaScript` and `customCss` are length-limited and embedded only in the generated app shell. They are never executed by the API server and cannot provide server-side code execution.
