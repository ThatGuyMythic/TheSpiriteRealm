---
name: Image generation limits
description: Free tier image gen constraints and file naming behavior
---

## Rule
Free tier: **10 images per run** (session). Exceeding it throws "Image generation limit reached."

## outputPath behavior
`outputPath` in `generateImage` (synchronous) **works correctly** — images save directly to the specified path (e.g. `artifacts/the-spirit-realm/public/art/enemy-goblin.png`).

`generateImageAsync` (async) does **not** reliably save to outputPath — images land in `attached_assets/generated_images/` with random hex hash names. Prefer synchronous `generateImage` in batches of 10 for reliable file placement.

**How to apply:** Use `generateImage` with explicit `outputPath` per image. No rename step needed.

## Ordering
Files are named with random hashes — not sequential. Must visually identify each image to match it to its intended asset name.
