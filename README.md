# `experimental.bundledDev`: virtual modules fail with `UNRESOLVED_ENTRY`

Minimal reproduction for a bug in Vite 8's bundled dev mode: a plugin virtual
module reached through a dynamic import cannot be loaded, because the lazy entry
rolldown creates for it can never be resolved.

## Steps

```sh
pnpm install
pnpm dev
```

Open the page.

**Expected:** the page shows `hello from a virtual module`.

**Actual:** the page shows

```
ERR Failed to fetch dynamically imported module: virtual:lazy-me
```

and the terminal shows

```
✘ Build error: Build failed with 1 error:

[UNRESOLVED_ENTRY] Cannot resolve entry module \0virtual:lazy-me?rolldown-lazy=1.
```

No file edit or rebuild is needed — it happens on first load.

## What happens

`src/main.js` dynamically imports `./lazy-me`, which `vite.config.mjs` resolves
to the virtual module `\0virtual:lazy-me`. Rolldown makes that a lazy entry and
emits a stub chunk. At runtime the stub asks the server to compile the entry:

```
/@vite/lazy?id=%00virtual%3Alazy-me%3Frolldown-lazy%3D1&clientId=...
```

That compile calls `resolveId` with

```
source:   "\0virtual:lazy-me?rolldown-lazy=1"
importer: undefined
isEntry:  true
```

The plugin only recognizes its own id (`\0virtual:lazy-me`), so it returns
`null`. Nothing else can resolve a virtual id, and the build fails.

Modules backed by a real file survive this, because Vite's resolver strips the
query for on-disk paths. Only virtual modules break.

## Why it matters

Any plugin that serves virtual modules through dynamic imports is unusable under
`experimental.bundledDev`. Seen in the wild with `@embroider/vite` (route
entrypoints) and `@ember-intl/vite` (translations).

Vite already shields plugin `transform` hooks from these stub ids — there is a
single `id.includes("?rolldown-lazy=")` check in the dev bundler — and
[#22651](https://github.com/vitejs/vite/issues/22651) /
[#22758](https://github.com/vitejs/vite/issues/22758) were resolved by having
plugins skip the query. `resolveId` and `load` are not shielded, so today every
virtual-module plugin has to string-match a rolldown-internal query to survive.

## Versions

vite 8.2.0, rolldown 1.2.1, node 24.14.0, macOS 26.3
