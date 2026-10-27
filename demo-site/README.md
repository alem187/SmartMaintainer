# SmartMaintainer · Demo workspace

The existing SmartMaintainer demo, exported as a static website in the additive `demo-site/` subtree. This is a contribution showcase for a pre-existing application: the interactive workspace, analytics improvements and regression tests from [merged pull request #1](https://github.com/alem187/SmartMaintainer/pull/1). It does not change the main application's routes, dependencies or backend.

## Try the workflow

- Open a synthetic maintenance ticket and assign a team.
- Change its status, add a next step or leave a note.
- Move tickets between the three board columns, or use the status selector.
- Create a new example ticket, filter the board and export the visible tickets as CSV.
- Switch to analytics to inspect categories, urgency, trends and the report export.
- Reset the demo to its original fixtures.

All data is invented. Changes live only in browser memory and disappear on reload. No account, backend connection, real AI request or message is used. The CSV report deliberately excludes team assignments and notes, as the interface explains.

## Development

Node.js 22.18 or newer is required.

```sh
npm ci
npm test
npm run typecheck
npm run dev
```

Run these commands from `demo-site/`. Open `http://localhost:3000/SmartMaintainer/` in development.

Build for the upstream repository's GitHub Pages path:

```sh
npm run build
```

The default base path is `/SmartMaintainer`. Deploy the generated `out/` directory. An explicit `PAGES_BASE_PATH` overrides the default; set it to an empty string for a domain-root deployment or a root-path local static server.

## GitHub Pages

The root workflow `.github/workflows/demo-pages.yml` tests and builds only this subtree, then uploads `demo-site/out/`. Pull requests run the checks without deploying. A push to `main` or a manual workflow run can deploy after the repository owner enables **Settings → Pages → Source: GitHub Actions**. No live deployment is claimed by this source change.

The static copy preserves the existing components and tests. It does not expose the original application's viewer, administration, authentication, AI service or database routes.

See [source attribution and rights](ATTRIBUTION.md). The source snapshot did not include a license; this additive subtree does not introduce one or relicense the upstream work.
