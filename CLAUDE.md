# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PetaKarta is a client-only choropleth map tool for Indonesian provincial statistics. Users upload CSV data and produce publication-ready maps — no backend, no signup. Deployed to GitHub Pages at `ismailsunni.id/petakarta`.

## Build & Dev Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build locally
npm run deploy     # Build + deploy to GitHub Pages (gh-pages branch)
```

## Critical Configuration

- `vite.config.js` must set `base: '/petakarta/'` for GitHub Pages deployment
- GeoJSON loaded from `import.meta.env.BASE_URL + 'data/indonesia_provinces.geojson'`

## Tech Stack

- **React 18** (functional components + hooks only) with **Vite 5**
- **Tailwind CSS 3** + shadcn/ui for styling
- **OpenLayers 9** for map rendering
- **Zustand 4** for state (single `mapStore`)
- **chroma.js** for color ramps, **simple-statistics** for classification (Jenks/quantile/equal interval)
- **PapaParse** for CSV parsing, **html2canvas** for legend export compositing

## Architecture

### State Management
Single Zustand store at `src/store/mapStore.js` holds all app state: CSV data, column mappings, join results, style settings, and UI state. Derived values (color scale, classification breaks) are computed via selectors, not stored.

### Map Layer Pattern
All OpenLayers map mutations must happen inside `useEffect` hooks or OL event handlers — never directly in render. Key hooks:
- `useMapInstance.js` — OL map ref management
- `useProvinceLayer.js` — vector layer + dynamic style updates
- `useMapExport.js` — PNG export via OL canvas API

### Data Flow
1. CSV parsed with PapaParse → columns stored in Zustand
2. User selects province key column (ID or name) + value column
3. `provinceMatcher.js` joins CSV to GeoJSON features via `ADM1_PCODE` (exact match for IDs, fuzzy match + alias table for names)
4. Style function reads `valueMap` from join result, applies chroma.js color scale per feature

### Project Structure
- `src/components/Map/` — MapView, Tooltip, Legend (OL overlays)
- `src/components/Sidebar/` — Tabbed sidebar (Data/Style/Export tabs)
- `src/utils/` — Pure logic: color ramps, classification breaks, CSV parsing, province matching
- `public/data/` — Pre-processed GADM 4.1 GeoJSON (38 provinces, <1.5MB)
- `public/samples/` — Sample CSV files (GDP, HDI, population density)

## Implementation Order

Follow milestones strictly: P1 (core map + data join) → P2 (styling + classification) → P3 (polish + export) → P4 (deploy). Verify `npm run build` succeeds after each phase.

## Design Tokens

Custom colors defined in `tailwind.config.js`: `ink` (#1a1a2e), `paper` (#f8f6f1), `canvas` (#edeae3), `accent` (#e63946). Typography: Playfair Display (headings), IBM Plex Sans (body), IBM Plex Mono (numbers/values).

## Open Tasks (Beads)

- `petakarta-03s` — Add attribution/source field to map
- `petakarta-8ea` — Improve color ramp picker with grouped dropdown
- `petakarta-zx4` — Investigate inkmap for print-quality map export
- `petakarta-cax` — Add share to social media buttons

Run `bd list` to see current status. Close beads with `bd close <id>` after completing.

## Key Constraints

- No backend — everything runs in the browser; no API calls except OSM tile fetching
- CSV only — no XLSX support in v1
- GeoJSON is a static pre-bundled asset, not fetched from an external API
- Mobile is read-only (map only, no upload)
- 38 Indonesian provinces with `ADM1_PCODE` as the canonical identifier
