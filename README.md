# Margin

A block-based math notebook for building dependency graphs of definitions, lemmas, theorems, and remarks. Proof status is derived automatically: a node is "proved" once all its dependencies are proved and a proof sketch is written.

## Running

```bash
./serve.sh          # serves on http://localhost:5174
```

Or open `index.html` directly in a browser (file:// works for everything except drag-to-canvas from the global library).

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

`proof` is `null` for definitions. `uses` lists dependency ids. A node is counted as proved when all its dependencies are proved and `proof.text` is non-empty.

## Features

- **Dependency graph** — layered auto-layout with pan, zoom, and drag to reposition nodes.
- **Detail panel** — click any node to see its statement, proof sketch, dependencies, and status chip (Defined / ✓ Proved / Ready / Waiting on deps).
- **Edit modal** — edit kind, title, statement, proof sketch, and dependencies with live LaTeX preview (KaTeX).
- **Link mode** — drag from one node to another to add a dependency edge.
- **Select & group** — rubber-band select multiple nodes, then group them into a collapsible knowledge set.
- **Knowledge sets** — import any blueprint JSON as a collapsible set; collapse/expand on the canvas.
- **Global library** — upload blueprint JSONs to a persistent library, then drag them onto the canvas of any project.
- **Multi-project workspace** — create, load, and switch between multiple projects in the sidebar.
- **LaTeX export** — Export → Download .tex generates a `content.tex` file using leanblueprint-compatible environments (definition, lemma, theorem, proof) with `\uses{}` references.
- **Save / Load** — Save downloads `blueprint.json`; Load replaces the current project; Reset returns to the built-in Finsler sample.
