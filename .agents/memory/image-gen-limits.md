---
name: Image generation limits
description: Free tier image gen constraints and file naming behavior
---

## Rule
Free tier: **10 images per run** (session). Exceeding it throws "Image generation limit reached."

## outputPath behavior
The `outputPath` parameter in `generateImage` / `generateImageAsync` does **not** save to the specified path. Images always land in `attached_assets/generated_images/` with auto-generated hex hash names (e.g. `medieval_fantasy_pixel_art_26e5.png`). Must copy/rename after generation.

**Why:** The sandbox intercepts file writes and routes them to attached_assets regardless of the path specified.

**How to apply:** After generating a batch, use `read` tool on each image file to visually identify them, then `cp` to the correct destination with proper names.

## Ordering
Files are named with random hashes — not sequential. Must visually identify each image to match it to its intended asset name.
