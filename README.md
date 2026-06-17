# Margin

A block-based math notebook for building dependency graphs of definitions, lemmas, theorems, and remarks. Proof status is derived automatically: a node is "proved" once all its dependencies are proved and a proof is written.

## Building the macOS app (DMG)

**Requirements:** macOS, [Node.js](https://nodejs.org) ≥ 18.

```bash
# 1. Clone the repository
git clone https://github.com/ypan-code-usc/margin.git
cd margin

# 2. Install dependencies (Electron + KaTeX)
npm install

# 3. Build the DMG
npm run build
```

The finished disk image is written to `dist/Margin-1.0.0-arm64.dmg`. Open it, drag **Margin.app** to `/Applications`, and launch.

> **Apple Silicon only.** The bundled Electron binary targets `arm64`. If you are on an Intel Mac, replace the `electron` package with an x64 build and re-run `npm run build`.

### What the build does

`build.sh` (invoked by `npm run build`) performs these steps:

1. Downloads the Electron binary if it is not already cached in `node_modules/electron/dist`.
2. Copies the KaTeX assets from `node_modules/katex` into `vendor/katex/` so the app works fully offline.
3. Assembles `dist-app/Margin.app` by copying the Electron shell and injecting `index.html`, `style.css`, `app.js`, `main.js`, and `vendor/`.
4. Renames the bundle from *Electron* to *Margin* (display name, bundle identifier, executable).
5. Packages the `.app` into a compressed DMG using `hdiutil`.

### Running without building

You can run the app directly from the source tree with Electron:

```bash
npm start          # launches Margin in development mode
```

Or open `index.html` directly in a browser (`file://` works for everything except dragging sets from the global library).

---

## JSON format

Load or save projects as `blueprint.json`:

```json
{
  "project": { "title": "My Project" },
  "nodes": [
    {
      "id": "def:foo",
      "kind": "definition",
      "title": "Foo",
      "statement": "A <i>foo</i> is ...",
      "uses": [],
      "proof": null
    },
    {
      "id": "lem:bar",
      "kind": "lemma",
      "title": "Bar lemma",
      "statement": "Every foo satisfies ...",
      "uses": ["def:foo"],
      "proof": {
        "uses": ["def:foo"],
        "text": "Follows directly from the definition."
      }
    }
  ]
}
```

`proof` is `null` for definitions. `uses` lists dependency IDs. A node is counted as proved when all its dependencies are proved and `proof.text` is non-empty.

---

## Features

- **Dependency graph** — layered auto-layout with pan, zoom, and drag to reposition nodes.
- **Detail panel** — click any node to see its statement, proof, dependencies, and status chip (Defined / ✓ Proved / Ready / Waiting).
- **Edit modal** — edit kind, title, statement, proof, and dependencies with live LaTeX preview (KaTeX). Includes a per-node AI chat panel and an *Architect proof* button that decomposes a written proof into new nodes.
- **⌘K search** — fuzzy search across all nodes by title or statement text with keyboard navigation.
- **Link mode** — drag from one node to another to add a dependency edge (cycle detection prevents circular dependencies).
- **Select & group** — rubber-band lasso to select multiple nodes, then group them into a collapsible knowledge set.
- **Knowledge sets** — nested, collapsible sets of nodes; drag a collapsed set onto an open frame to nest it; lasso-select inside an expanded frame.
- **Save set to project** — exports a knowledge set (plus all transitive dependencies) as a new project.
- **Global library** — upload blueprint JSONs to a persistent library, then drag them onto any project canvas.
- **Multi-project workspace** — create, load, and switch between multiple projects in the sidebar. All data autosaves to `localStorage`.
- **AI integration** — Anthropic Claude, OpenAI, and Google Gemini backends; configure API keys in Preferences.
- **Proof Architect** — AI decomposes your written proof into a structured node graph.
- **LaTeX export** — generates a `content.tex` file using leanblueprint-compatible environments with `\uses{}` references.
- **Save / Load** — Save downloads `blueprint.json`; Load replaces the current project; Reset returns to the built-in Finsler sample.
