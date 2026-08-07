# OpenDiff

An open source, privacy-first diff checker that runs entirely in your browser.
Compare two texts side by side — no data ever leaves your device.

Built with React, TypeScript and [jsdiff](https://github.com/kpdecker/jsdiff),
with all diff computation happening in a Web Worker.

## Features

- Side-by-side and inline (unified) diff views
- Intra-line highlighting at character or word granularity
- Paste text, open files (up to 10 MB), or drag & drop
- Ignore case / whitespace / line endings (CRLF) options
- Adjustable context lines with hidden-region collapse
- Diff stats, unified `.patch` export (copy or download)
- Dark mode, wrap toggle, line numbers toggle
- Inputs and preferences persisted in `localStorage`

## Getting started

```sh
npm install
npm run dev        # start the dev server
```

Production build:

```sh
npm run build      # type-check + build to dist/
npm run preview    # serve the production build
```

## Tests

```sh
npm run test       # diff engine unit tests (tsx)
npm run test:e2e   # Playwright smoke tests against a production build
```

## How it works

`src/lib/diffEngine.ts` runs a line-level Myers diff (via a `Diff` subclass
that adds `ignoreCase` support, which jsdiff's typed line options omit),
pairs removed/added lines into "modified" rows, and produces char- or
word-level spans for those pairs. The unified patch is generated directly
from the same rows so exports always match what is displayed.
`src/diffWorker.ts` keeps heavy computation off the main thread.

## License

MIT
