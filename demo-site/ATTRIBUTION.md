# Source and contribution boundary

This additive `demo-site/` subtree is a static extraction of the **existing** `/demo` workspace from [alem187/SmartMaintainer](https://github.com/alem187/SmartMaintainer), source commit [`15c515e05840adbb54b32984e961cc4697da11c1`](https://github.com/alem187/SmartMaintainer/commit/15c515e05840adbb54b32984e961cc4697da11c1). It is prepared to remain in that upstream repository, with an additional root-level Pages workflow and no main-app changes.

The workspace, analytics improvements, synthetic fixtures and regression tests were introduced by [pull request #1](https://github.com/alem187/SmartMaintainer/pull/1), which was merged into the existing application. This demo does not claim authorship of the whole SmartMaintainer application.

## Retained

- `DemoWorkspace.tsx` and `AnalyticsReport.tsx` retain the original demo implementation.
- `analytics.ts`, `workspace.ts`, `demo-tickets.ts` and the regression tests retain the same logic and fixtures.
- The original Tailwind styles remain, with a system font stack replacing the build-time Google font.

## Adapted for static hosting

- Only the demo page is exported at `/` and `/demo/`.
- The root layout does not mount an authentication or database provider.
- Backend-branded ID types are plain strings in this demo-only copy.
- The static export supports a GitHub Pages base path.
- A visible footer identifies the original project and the contribution.

## Rights and dependencies

No `LICENSE` file was present in the source snapshot. This subtree does not add a license to, relicense or claim ownership of the upstream code. Existing rights remain with their respective holders. No MIT license or other new license is assigned to the copied components.

Third-party packages retain their own licenses. They are declared in `package.json` and the lockfile. No upstream Git history, environment files, backend schema, real database records, authentication code or private credentials are included.
