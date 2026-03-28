# Product Requirements Document — PetaKarta
**Version:** 2.0  
**Date:** 2026-02-28  
**Status:** Ready for Implementation

---

## 0. AI Implementation Notes

> This section is specifically for AI coding assistants (Claude Code, Cursor, etc.).

- **Build order**: Follow the milestones in Section 10 exactly — P1 → P2 → P3 → P4.
- **One component at a time**: Implement, test render, then move on.
- **State management**: Use Zustand for global app state (mapStore). Pass only what's needed as props.
- **Map interactions**: All OpenLayers map mutations must happen inside `useEffect` hooks or dedicated OL event handlers — never directly in render.
- **No backend**: Everything runs in the browser. No API calls except tile fetching from OSM.
- **GeoJSON is static**: The province GeoJSON is a pre-bundled public asset. It does NOT change at runtime.
- **Critical constraint**: The `vite.config.js` must set `base: '/petakarta/'` for correct GitHub Pages deployment at `ismailsunni.id/petakarta`.
- **After each phase**: Verify `npm run build` succeeds before proceeding to the next phase.

---

## 1. Project Identity

| Field | Value |
|---|---|
| App name | **PetaKarta** |
| Tagline | Visualize Indonesia, Province by Province |
| Live URL | `https://ismailsunni.id/petakarta` |
| GitHub repo | `https://github.com/ismailsunni/petakarta` |
| Deploy target | GitHub Pages (via `gh-pages` branch) |

---

## 2. Problem Statement

Analysts and researchers working with Indonesian provincial statistics (GDP, HDI, population, etc.) need a quick way to produce choropleth maps from their own CSV data. Existing GIS tools (QGIS, ArcGIS) have high friction; web tools like Datawrapper are limited. PetaKarta is a zero-signup, client-only tool that accepts any CSV and produces a publication-ready map in under 2 minutes.

---

## 3. Tech Stack (Locked)

| Layer | Library / Tool | Version | Notes |
|---|---|---|---|
| Framework | React | 18 | Functional components + hooks only |
| Build tool | Vite | 5 | `base: '/petakarta/'` in config |
| Styling | Tailwind CSS | 3 | + shadcn/ui for UI components |
| Map engine | OpenLayers | 9 | CDN import via npm |
| Color math | chroma.js | 2 | Color ramp generation |
| Classification | simple-statistics | 7 | Jenks, quantile, equal interval |
| CSV parsing | PapaParse | 5 | Header detection auto-enabled |
| State | Zustand | 4 | Single `mapStore` |
| Export | OL canvas API | — | `map.once('rendercomplete', ...)` pattern |
| Deploy | gh-pages npm pkg | — | `npm run deploy` |

**No XLSX support in v1. CSV only.**

---

## 4. UI / UX Design Direction

### 4.1 Visual Style: "Cartographic Tool" — Clean Data Journalism Aesthetic

Inspired by tools like The Pudding, NYT graphics desk, and Observable. The UI should feel like a **professional cartographic instrument**, not a generic dashboard.

**Design tokens to implement in `tailwind.config.js`:**

```js
colors: {
  ink: '#1a1a2e',         // deep navy-black for text
  paper: '#f8f6f1',       // warm off-white background
  canvas: '#edeae3',      // slightly darker for map surround
  accent: '#e63946',      // bold red accent (buttons, highlights)
  accentMuted: '#ff6b6b', // lighter red for hover
  muted: '#6b7280',       // gray for secondary text
  border: '#d4d0c8',      // warm border tone
}
```

**Typography:**
```html
<!-- In index.html <head> -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
```
- Display/headings: `Playfair Display` (editorial weight)
- Body/UI: `IBM Plex Sans`
- Numbers/values: `IBM Plex Mono`

### 4.2 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: "PetaKarta" logo (left) + tagline + GitHub icon     │
│ bg: ink, text: paper                                        │
├────────────────────┬────────────────────────────────────────┤
│ LEFT SIDEBAR       │  MAP CANVAS (OpenLayers)               │
│ width: 320px       │  bg: canvas                            │
│ bg: paper          │                                        │
│ overflow-y: scroll │  ┌────────────────────┐                │
│                    │  │ Legend (overlay)   │                │
│ ── SECTION TABS ── │  └────────────────────┘                │
│ [Data][Style][Map] │                                        │
│                    │  Toolbar: [🔍Fit] [±Zoom] [📷Export]  │
│ TAB CONTENT        │  (floating, top-right of map)          │
│ (see Section 4.3)  │                                        │
│                    │  Tooltip: appears on hover             │
│                    │                                        │
├────────────────────┴────────────────────────────────────────┤
│ FOOTER: "Data: GADM 4.1 · Built with OpenLayers · © 2026"  │
└─────────────────────────────────────────────────────────────┘
```

- **Sidebar**: Fixed 320px, scrollable, tabbed (3 tabs: Data / Style / Export)
- **Map**: `flex-1`, fills all remaining width and height between header/footer
- **Header height**: 52px
- **Footer height**: 32px
- **Mobile (< 768px)**: Sidebar hidden. Map fills full screen. Floating bottom sheet with "Upload" button that opens a modal. Map is read-only (zoom/pan allowed, upload not available in this phase).

### 4.3 Sidebar Tab Contents

#### Tab 1: Data
```
┌─────────────────────────────┐
│ ① Upload CSV                │
│   [Drag & drop zone]        │
│   "or click to browse"      │
│   Accepts: .csv             │
│                             │
│ ② Column Mapping            │
│   (shown after upload)      │
│   Province key: [dropdown]  │
│   Key type: ○ ID  ● Name    │
│   Value:    [dropdown]      │
│   [Apply →] button          │
│                             │
│ ③ Join Status               │
│   ✓ 34/38 provinces matched │
│   ⚠ 4 unmatched             │
│                             │
│ ④ Data Preview              │
│   (mini table, 5 rows)      │
│                             │
│ ── or try sample data ──    │
│ [GDP per Capita] [HDI]      │
│ [Population Density]        │
└─────────────────────────────┘
```

#### Tab 2: Style
```
┌─────────────────────────────┐
│ Color Ramp                  │
│ [Visual ramp picker row]    │
│  Sequential: Blues Greens   │
│             Reds YlOrRd     │
│             Viridis Magma   │
│  Diverging:  RdBu BrBG      │
│ [↔ Reverse toggle]         │
│                             │
│ Classification              │
│ Method: [dropdown]          │
│  ○ Quantile (default)       │
│  ○ Equal Interval           │
│  ○ Natural Breaks (Jenks)   │
│  ○ Manual                   │
│ Classes: 3 ━━●━━━━━━ 9      │
│          (slider: 5)        │
│                             │
│ Appearance                  │
│ Stroke color: [■] [width: 1]│
│ No-data color: [■]          │
│                             │
│ Labels                      │
│ Map title: [____________]   │
│ Legend title: [__________]  │
│ [x] Show province names     │
└─────────────────────────────┘
```

#### Tab 3: Export
```
┌─────────────────────────────┐
│ Download Map                │
│                             │
│ Resolution:                 │
│  ○ Standard (1×)            │
│  ● High-res (2×)            │
│                             │
│ [⬇ Download PNG]            │
│                             │
│ File: indonesia-map-        │
│       {timestamp}.png       │
│                             │
│ Note: Legend and title      │
│ are included in export.     │
└─────────────────────────────┘
```

---

## 5. Feature Specifications

### 5.1 Map Component (`src/components/Map/MapView.jsx`)

Initialize OpenLayers map with:
```js
// Tile layer: OSM (default, toggleable)
new TileLayer({ source: new OSM() })

// Province vector layer
new VectorLayer({
  source: new VectorSource({
    url: import.meta.env.BASE_URL + 'data/indonesia_provinces.geojson',
    format: new GeoJSON()
  }),
  style: defaultProvinceStyle  // neutral gray fill
})
```

Map view settings:
```js
new View({
  center: fromLonLat([118, -2.5]),  // center of Indonesia
  zoom: 5,
  minZoom: 4,
  maxZoom: 12
})
```

**Required map interactions:**
- Mouse hover → pointer cursor on province features → trigger tooltip
- "Fit to Indonesia" button → `map.getView().fit(indonesiaBbox, { padding: [20,20,20,20] })`
- Zoom in/out buttons (supplement scroll wheel)

### 5.2 Province GeoJSON (`/public/data/indonesia_provinces.geojson`)

**Source**: GADM 4.1 level-1 (ADM1) for Indonesia  
**Download**: `https://gadm.org/download_country.html` — select Indonesia → GeoJSON level 1  
**Processing required before bundling**:
1. Use `mapshaper` CLI to simplify geometry: `mapshaper input.json -simplify 5% -o output.json`
2. Filter out any features that are purely water/sea (GADM level 1 should be land-only for Indonesia — if any water polygons exist, filter by `TYPE_1 != 'Water'` or similar)
3. Retain only these properties per feature (strip all others to reduce file size):
   ```json
   {
     "ADM1_PCODE": "ID-AC",
     "province_name": "Aceh",
     "province_name_en": "Aceh"
   }
   ```
4. Target file size: **< 1.5MB raw, < 400KB gzipped**
5. Expected feature count: **38 provinces**

**Province ID reference table** (must be consistent with GeoJSON properties):

| ADM1_PCODE | province_name | province_name_en |
|---|---|---|
| ID-AC | Aceh | Aceh |
| ID-SU | Sumatera Utara | North Sumatra |
| ID-SB | Sumatera Barat | West Sumatra |
| ID-RI | Riau | Riau |
| ID-KR | Kepulauan Riau | Riau Islands |
| ID-JA | Jambi | Jambi |
| ID-SS | Sumatera Selatan | South Sumatra |
| ID-BB | Kepulauan Bangka Belitung | Bangka Belitung Islands |
| ID-BE | Bengkulu | Bengkulu |
| ID-LA | Lampung | Lampung |
| ID-JK | DKI Jakarta | Jakarta |
| ID-JB | Jawa Barat | West Java |
| ID-BT | Banten | Banten |
| ID-JT | Jawa Tengah | Central Java |
| ID-YO | DI Yogyakarta | Yogyakarta |
| ID-JI | Jawa Timur | East Java |
| ID-BA | Bali | Bali |
| ID-NB | Nusa Tenggara Barat | West Nusa Tenggara |
| ID-NT | Nusa Tenggara Timur | East Nusa Tenggara |
| ID-KB | Kalimantan Barat | West Kalimantan |
| ID-KT | Kalimantan Tengah | Central Kalimantan |
| ID-KI | Kalimantan Timur | East Kalimantan |
| ID-KS | Kalimantan Selatan | South Kalimantan |
| ID-KU | Kalimantan Utara | North Kalimantan |
| ID-SA | Sulawesi Utara | North Sulawesi |
| ID-GO | Gorontalo | Gorontalo |
| ID-ST | Sulawesi Tengah | Central Sulawesi |
| ID-SR | Sulawesi Barat | West Sulawesi |
| ID-SN | Sulawesi Selatan | South Sulawesi |
| ID-SG | Sulawesi Tenggara | Southeast Sulawesi |
| ID-MA | Maluku | Maluku |
| ID-MU | Maluku Utara | North Maluku |
| ID-PA | Papua | Papua |
| ID-PB | Papua Barat | West Papua |
| ID-PE | Papua Pegunungan | Highland Papua |
| ID-PS | Papua Selatan | South Papua |
| ID-PT | Papua Tengah | Central Papua |
| ID-PD | Papua Barat Daya | Southwest Papua |

### 5.3 Data Upload & Join (`src/components/Sidebar/DataUpload.jsx`)

**Parse CSV with PapaParse:**
```js
Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
  complete: (results) => { /* store results.data and results.meta.fields */ }
})
```

**Column mapping UI:**
- Dropdown 1: "Province Key Column" — lists all CSV column names
- Radio: "Key Type" — `ID (e.g. ID-AC)` or `Name (e.g. Aceh)`
- Dropdown 2: "Value Column" — lists all CSV column names (numeric columns preferred/highlighted)

**Join logic (`src/utils/provinceMatcher.js`):**

When key type is **ID**: Exact match on `ADM1_PCODE` (case-insensitive).

When key type is **Name**: Fuzzy match pipeline:
1. Normalize: `str.toLowerCase().replace(/[^\w\s]/g, '').trim()`
2. Direct match against `province_name` (normalized)
3. Alias lookup table for common variants:
   ```js
   const ALIASES = {
     'yogyakarta': 'ID-YO',
     'di yogyakarta': 'ID-YO',
     'diy': 'ID-YO',
     'jakarta': 'ID-JK',
     'dki jakarta': 'ID-JK',
     'kepri': 'ID-KR',
     'sulsel': 'ID-SN',
     'sumut': 'ID-SU',
     'sumbar': 'ID-SB',
     'sumsel': 'ID-SS',
     'kalbar': 'ID-KB',
     'kalteng': 'ID-KT',
     'kaltim': 'ID-KI',
     'kalsel': 'ID-KS',
     'kaltara': 'ID-KU',
     'sulut': 'ID-SA',
     'sulteng': 'ID-ST',
     'sulbar': 'ID-SR',
     'sultra': 'ID-SG',
     'ntb': 'ID-NB',
     'ntt': 'ID-NT',
     'malut': 'ID-MU',
     'pabar': 'ID-PB',
   }
   ```

**Join result object** (stored in Zustand):
```js
{
  matched: 34,           // count
  unmatched: 4,          // count
  unmatchedKeys: [...],  // list of CSV keys that didn't match
  valueMap: {            // Map<ADM1_PCODE, number>
    'ID-AC': 42.5,
    'ID-JK': 87.2,
    // ...
  }
}
```

Show warning banner if `matched < 19` (< 50% of 38).

### 5.4 Classification (`src/utils/classificationUtils.js`)

Use `simple-statistics` library:

```js
import { ckmeans, quantile } from 'simple-statistics'

function getBreaks(values, method, numClasses) {
  switch (method) {
    case 'quantile':
      return quantileBreaks(values, numClasses)        // ss.quantile
    case 'equalInterval':
      return equalIntervalBreaks(values, numClasses)   // manual
    case 'jenks':
      return ckmeans(values, numClasses)               // ss.ckmeans -> extract boundaries
    case 'manual':
      return manualBreaks  // from user input, stored in state
  }
}
```

Output: array of `numClasses + 1` break values (min, break1, break2, ..., max).

### 5.5 Color Ramp (`src/utils/colorUtils.js`)

```js
import chroma from 'chroma-js'

const PRESETS = {
  // Sequential
  Blues:  ['#f7fbff', '#08306b'],
  Greens: ['#f7fcf5', '#00441b'],
  Reds:   ['#fff5f0', '#67000d'],
  YlOrRd: ['#ffffcc', '#800026'],
  Viridis: chroma.brewer.Viridis,  // use chroma built-in
  Magma:  chroma.brewer.Magma,
  // Diverging
  RdBu:   chroma.brewer.RdBu,
  BrBG:   chroma.brewer.BrBG,
}

function buildColorScale(presetKey, numClasses, reversed) {
  let scale = chroma.scale(PRESETS[presetKey]).classes(numClasses)
  if (reversed) scale = scale.domain([1, 0])
  return scale  // call scale(value).hex() to get color
}
```

### 5.6 OpenLayers Province Styling

When data is applied, update the vector layer style function:

```js
const styleFunction = (feature) => {
  const pcode = feature.get('ADM1_PCODE')
  const value = valueMap.get(pcode)
  
  if (value === undefined) {
    return new Style({
      fill: new Fill({ color: noDataColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth })
    })
  }
  
  const color = colorScale(value).hex()
  return new Style({
    fill: new Fill({ color }),
    stroke: new Stroke({ color: strokeColor, width: strokeWidth })
  })
}
vectorLayer.setStyle(styleFunction)
```

### 5.7 Tooltip (`src/components/Map/Tooltip.jsx`)

- Rendered as a `<div>` absolutely positioned over the map container
- Updated on `pointermove` OL event:
  ```js
  map.on('pointermove', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
    if (feature) {
      const name = feature.get('province_name')
      const value = valueMap.get(feature.get('ADM1_PCODE'))
      setTooltip({ visible: true, x: evt.pixel[0], y: evt.pixel[1], name, value })
    } else {
      setTooltip({ visible: false })
    }
  })
  ```
- Style: dark bg `#1a1a2e`, white text, `IBM Plex Mono` for value, rounded, subtle shadow
- Show: province name (bold) + value (mono font) or "No data" (muted)

### 5.8 Legend (`src/components/Map/Legend.jsx`)

- Rendered as an overlay `<div>` with `position: absolute` inside the map container
- 4 snap positions: top-left, top-right, bottom-left, bottom-right (default: bottom-right)
- Toggle between positions via cycling button (not drag — simpler for v1)
- Contents:
  - Legend title (from state, editable)
  - Color swatches with range labels (e.g. `23.4 – 45.1`)
  - "No data" swatch if any unmatched provinces
- Style: semi-transparent white bg, `border: 1px solid #d4d0c8`, padding 12px, min-width 160px

### 5.9 Export (`src/hooks/useMapExport.js`)

Use OpenLayers' built-in canvas export (most reliable for tile layers):

```js
function exportMap(resolution) {
  const mapCanvas = document.createElement('canvas')
  const size = map.getSize()
  mapCanvas.width = size[0] * resolution
  mapCanvas.height = size[1] * resolution
  const ctx = mapCanvas.getContext('2d')

  // Fill background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height)

  // Composite all OL canvas layers
  map.getViewport().querySelectorAll('.ol-layer canvas').forEach(canvas => {
    if (canvas.width > 0) {
      ctx.drawImage(canvas, 0, 0, mapCanvas.width, mapCanvas.height)
    }
  })

  // Draw legend (screenshot legend DOM element via html2canvas, composite onto mapCanvas)
  // Draw title text at top

  mapCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `indonesia-map-${Date.now()}.png`
    a.click()
  })
}
```

For the legend overlay: use `html2canvas` on the legend `<div>` and composite onto `mapCanvas`.

---

## 6. State Management (`src/store/mapStore.js`)

Use Zustand. Full store shape:

```js
{
  // Data state
  csvData: null,           // raw PapaParse output
  csvColumns: [],          // array of column name strings
  keyColumn: '',           // selected province key column
  keyType: 'name',         // 'id' | 'name'
  valueColumn: '',         // selected value column
  joinResult: null,        // { matched, unmatched, unmatchedKeys, valueMap }

  // Style state
  colorPreset: 'Viridis',  // key into PRESETS
  colorReversed: false,
  classMethod: 'quantile', // 'quantile' | 'equalInterval' | 'jenks' | 'manual'
  numClasses: 5,
  manualBreaks: [],        // used only when classMethod === 'manual'
  strokeColor: '#ffffff',
  strokeWidth: 0.8,
  noDataColor: '#e0e0e0',
  showBasemap: true,
  showProvinceLabels: false,
  
  // Annotation state
  mapTitle: '',
  legendTitle: '',
  legendPosition: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  
  // UI state
  activeTab: 'data',       // 'data' | 'style' | 'export'
  
  // Computed (derived in selectors, not stored)
  // colorScale — computed from colorPreset + colorReversed + numClasses
  // breaks — computed from joinResult.valueMap values + classMethod + numClasses
}
```

---

## 7. Sample Data Files

Create these in `/public/samples/`:

**`sample_gdp_per_capita.csv`** — GDP per capita (million IDR) per province
```csv
province_name,gdp_per_capita_2023
Aceh,38.2
Sumatera Utara,55.8
...
```

**`sample_hdi.csv`** — Human Development Index
```csv
pcode,hdi_2023
ID-AC,72.84
ID-SU,73.21
...
```

**`sample_population_density.csv`** — Population density (per km²)
```csv
province_name,pop_density
Aceh,32.4
...
```

Include realistic values for all 38 provinces in each file.

---

## 8. Project Structure

```
petakarta/
├── public/
│   ├── data/
│   │   └── indonesia_provinces.geojson   # Pre-processed GADM 4.1
│   └── samples/
│       ├── sample_gdp_per_capita.csv
│       ├── sample_hdi.csv
│       └── sample_population_density.csv
├── src/
│   ├── components/
│   │   ├── Header.jsx                    # App header
│   │   ├── Footer.jsx                    # Credits footer
│   │   ├── Map/
│   │   │   ├── MapView.jsx               # OL map init + container
│   │   │   ├── Tooltip.jsx               # Hover tooltip overlay
│   │   │   └── Legend.jsx                # Legend overlay (4-position)
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx               # Tab shell
│   │   │   ├── DataTab.jsx               # Upload + column mapping
│   │   │   ├── StyleTab.jsx              # Color + classification
│   │   │   └── ExportTab.jsx             # PNG download
│   │   └── UI/
│   │       ├── ColorRampPicker.jsx       # Visual ramp selection grid
│   │       ├── ClassBreakEditor.jsx      # Manual break inputs
│   │       └── JoinStatus.jsx            # Match count badge
│   ├── hooks/
│   │   ├── useMapInstance.js             # OL map ref management
│   │   ├── useProvinceLayer.js           # Vector layer + style updates
│   │   └── useMapExport.js               # PNG export logic
│   ├── utils/
│   │   ├── colorUtils.js                 # chroma.js wrappers + PRESETS
│   │   ├── classificationUtils.js        # Break computation (ss)
│   │   ├── csvParser.js                  # PapaParse wrapper
│   │   └── provinceMatcher.js            # Join logic + fuzzy match + ALIASES
│   ├── store/
│   │   └── mapStore.js                   # Zustand store
│   ├── App.jsx                           # Root layout
│   ├── main.jsx                          # Entry point
│   └── index.css                         # Tailwind directives + custom CSS vars
├── index.html                            # Google Fonts link here
├── vite.config.js                        # base: '/petakarta/'
├── tailwind.config.js                    # Custom design tokens
├── package.json
└── README.md
```

---

## 9. Configuration Files

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/petakarta/',
})
```

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 10. Implementation Milestones

### P1 — Core Map (implement first)
- [ ] Scaffold Vite + React + Tailwind project with correct `base` config
- [ ] Create `Header.jsx` and `Footer.jsx` with design tokens
- [ ] Initialize OpenLayers map in `MapView.jsx` with OSM basemap
- [ ] Load and render `indonesia_provinces.geojson` as vector layer (neutral gray)
- [ ] Implement "Fit to Indonesia" button
- [ ] Implement Zustand store (`mapStore.js`)
- [ ] Implement CSV upload + PapaParse in `DataTab.jsx`
- [ ] Implement column mapping dropdowns
- [ ] Implement join logic in `provinceMatcher.js`
- [ ] Apply joined data to map (basic choropleth, single color ramp)
- [ ] Basic PNG export (OL canvas only, no legend composite)
- [ ] `npm run build` passes ✓

### P2 — Styling & Classification
- [ ] Implement `colorUtils.js` with all presets + chroma.js
- [ ] Build `ColorRampPicker.jsx` (visual grid of ramp options)
- [ ] Implement `classificationUtils.js` with quantile, equal interval, jenks
- [ ] Connect classification + color to live map style updates
- [ ] Build `ClassBreakEditor.jsx` for manual breaks
- [ ] Add all style controls to `StyleTab.jsx`
- [ ] Implement `Legend.jsx` overlay with 4-position cycling
- [ ] `npm run build` passes ✓

### P3 — Polish & Export
- [ ] Implement `Tooltip.jsx` (hover province name + value)
- [ ] Composite legend into PNG export using html2canvas
- [ ] Add map title rendering in export
- [ ] Create sample CSV files with realistic data
- [ ] Add "Load sample" buttons in `DataTab.jsx`
- [ ] Add `JoinStatus.jsx` badge with matched/unmatched counts
- [ ] Mobile read-only layout (sidebar hidden, full-screen map)
- [ ] Final design polish (spacing, typography, transitions)
- [ ] `npm run build` passes ✓

### P4 — Deploy
- [ ] Process and bundle final `indonesia_provinces.geojson`
- [ ] Write `README.md`
- [ ] Add GitHub Actions workflow
- [ ] Test deploy: `npm run deploy`
- [ ] Verify at `https://ismailsunni.id/petakarta`

---

## 11. Dependencies

```json
{
  "dependencies": {
    "chroma-js": "^2.4.2",
    "ol": "^9.2.4",
    "papaparse": "^5.4.1",
    "simple-statistics": "^7.8.3",
    "zustand": "^4.5.2",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "gh-pages": "^6.1.1",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

---

## 12. Resolved Decisions

| Decision | Resolution |
|---|---|
| GeoJSON source | GADM 4.1 (land-only, Indonesia level 1) — simplified with mapshaper |
| Basemap | OpenStreetMap (no API key, default ON, toggleable) |
| Jenks classification | `simple-statistics` `ckmeans` function (~45KB) |
| XLSX support | **Not in v1** — CSV only |
| Mobile | Read-only map view; sidebar hidden; no upload on mobile in v1 |
| Deployment base path | `/petakarta/` |
| Repository | `github.com/ismailsunni/petakarta` |

---

*End of PRD v2.0 — PetaKarta*
