# PRD: Multi-Admin Layer Support

**Status:** Draft
**Date:** 2026-03-05

---

## Problem

PetaKarta is hard-coded to a single administrative layer: Indonesia's 38 provinces. Users who want to visualize sub-provincial data (e.g., cities/regencies within Yogyakarta, or districts within Jakarta) have no path forward. Every reference to GeoJSON, feature codes, label fields, and map extent is province-specific, scattered across several files.

---

## Goal

Allow users to select from a registry of pre-bundled administrative layers before uploading their CSV. The selected layer defines which GeoJSON is loaded, which feature ID/name fields are used for matching, and what map extent to fit. The rest of the pipeline (CSV join, style, export, project save/load) works identically regardless of which layer is active.

Initial launch ships two layers:
1. **Indonesia – Provinces** (existing, 38 features, `ADM1_PCODE`)
2. **Yogyakarta – Cities/Regencies** (new, GADM level 2, ~5 features)

---

## Non-Goals

- User-uploaded custom GeoJSON layers (future)
- Fetching GeoJSON from external APIs at runtime
- Any backend changes — all layers are static assets in `public/data/`
- Mobile edit mode

---

## Layer Registry

A new static config file `src/utils/adminLayers.js` defines every available layer:

```js
export const ADMIN_LAYERS = [
  {
    id: 'idn-province',
    name: 'Indonesia – Provinces',
    geojsonPath: 'data/indonesia_provinces.geojson',
    featureIdField: 'ADM1_PCODE',   // field used for exact-match (keyType='id')
    featureNameField: 'province_name', // field used for name-match + labels
    bbox: [94.5, -11.5, 141.5, 6.5], // EPSG:4326 [minX, minY, maxX, maxY]
    aliases: { /* existing ALIASES object moved here */ },
    level: 'province',
  },
  {
    id: 'idn-yogyakarta-city',
    name: 'Yogyakarta – Cities/Regencies',
    geojsonPath: 'data/yogyakarta_cities.geojson',
    featureIdField: 'ADM2_PCODE',
    featureNameField: 'city_name',
    bbox: [110.0, -8.2, 110.8, -7.6],
    aliases: {},
    level: 'city',
  },
]

export const DEFAULT_LAYER_ID = 'idn-province'

export function getLayer(id) {
  return ADMIN_LAYERS.find((l) => l.id === id) ?? ADMIN_LAYERS[0]
}
```

Each layer entry is self-contained. Adding a new layer in the future is a single array entry + one GeoJSON file in `public/data/`.

---

## GeoJSON Asset: Yogyakarta Cities

**Source:** GADM 4.1, Indonesia, level 2, filtered to `NAME_1 = "Yogyakarta"`.

**Processing steps:**
1. Download GADM Indonesia level 2 shapefile/GeoJSON.
2. Filter to 5 features: Kota Yogyakarta, Bantul, Sleman, Kulon Progo, Gunungkidul.
3. Reproject to EPSG:4326 (should already be in 4326).
4. Simplify geometry (tolerance ~0.001 deg) to keep file small (<200 KB).
5. Rename fields:
   - `GID_2` → `ADM2_PCODE` (e.g., `IDN.14.1_1`)
   - `NAME_2` → `city_name`
6. Strip unused fields.
7. Save to `public/data/yogyakarta_cities.geojson`.

The `ADM2_PCODE` values come directly from GADM `GID_2`. Users who want to join by ID must use these codes. A sample CSV `public/samples/yogyakarta_sample.csv` should be provided with two columns: `ADM2_PCODE` and a demo value (e.g., population density).

---

## Store Changes (`mapStore.js`)

### New state fields

| Field | Type | Description |
|---|---|---|
| `adminLayerId` | `string` | ID of the active layer from registry; default `'idn-province'` |
| `adminFeatures` | `array` | Feature metadata (id + name) loaded from GeoJSON — replaces `provinceFeatures` |

### Removed / renamed

- `provinceFeatures` → `adminFeatures` (rename, same shape: `[{ featureId, featureName }]`)
- `showProvinceLabels` → `showFeatureLabels` (rename for clarity)

### Setters to add/rename

```js
setAdminLayerId: (adminLayerId) => set({ adminLayerId, adminFeatures: [], joinResult: null }),
setAdminFeatures: (adminFeatures) => set({ adminFeatures }),
setShowFeatureLabels: (showFeatureLabels) => set({ showFeatureLabels }),
```

Changing `adminLayerId` resets `adminFeatures` and `joinResult` to force a fresh join after the new layer loads.

### `resetData` update

Include `adminLayerId: DEFAULT_LAYER_ID` and `adminFeatures: []` in the reset payload. Do **not** reset `adminLayerId` on sign-out — it is a UI preference, not user data.

### Persist / migrate

Add `adminLayerId` to `PERSIST_KEYS` (in `mapStore.js` partialize and in `projectsService.js`).
Bump store version to `3`; migration from v2: set `adminLayerId = 'idn-province'`, rename `showProvinceLabels` → `showFeatureLabels`.

---

## Feature Matcher Changes (`provinceMatcher.js` → `featureMatcher.js`)

Rename file and generalize signature:

```js
// Before
export function matchProvinces(csvData, keyColumn, keyType, valueColumn, provinceNames)

// After
export function matchFeatures(csvData, keyColumn, keyType, valueColumn, layerFeatures, layerConfig)
// layerFeatures: [{ featureId, featureName }]
// layerConfig: { featureIdField, featureNameField, aliases }
```

The `ALIASES` constant moves into `adminLayers.js` as a per-layer property. The matcher reads `layerConfig.aliases` instead of a module-level constant. All other logic (normalize, exact ID match, name match) is unchanged.

---

## Hook Changes (`useProvinceLayer.js` → `useAdminLayer.js`)

The hook becomes layer-agnostic:

```js
export default function useAdminLayer(map) {
  const adminLayerId = useMapStore((s) => s.adminLayerId)
  const setAdminFeatures = useMapStore((s) => s.setAdminFeatures)
  const layerConfig = getLayer(adminLayerId)
  // ...
}
```

**Key changes:**

1. **GeoJSON URL** — built from `layerConfig.geojsonPath`:
   ```js
   url: import.meta.env.BASE_URL + layerConfig.geojsonPath
   ```

2. **Feature metadata extraction** — uses `layerConfig.featureIdField` and `layerConfig.featureNameField`:
   ```js
   const featureData = features.map((f) => ({
     featureId: f.get(layerConfig.featureIdField),
     featureName: f.get(layerConfig.featureNameField),
   }))
   setAdminFeatures(featureData)
   ```

3. **Layer reload on layer change** — `adminLayerId` is in the first `useEffect` dependency array. When it changes, the old OL layer is removed and a new one is added.

4. **Style function** — reads the feature code via `layerConfig.featureIdField`:
   ```js
   const featureCode = feature.get(layerConfig.featureIdField)
   const value = valueMap[featureCode]
   ```

5. **Label text** — reads `layerConfig.featureNameField`:
   ```js
   text: feature.get(layerConfig.featureNameField)
   ```

6. **Map extent** — after the layer loads, fit the view to `layerConfig.bbox`:
   ```js
   const extent3857 = transformExtent(layerConfig.bbox, 'EPSG:4326', 'EPSG:3857')
   map.getView().fit(extent3857, { padding: FIT_PADDING, duration: 400 })
   ```

---

## UI Changes

### Layer selector (Data tab)

Add a layer selector **above** the CSV upload section, before the user picks columns. A `<select>` or radio group is sufficient:

```
Admin Layer
[ Indonesia – Provinces          v ]
```

- Populated from `ADMIN_LAYERS`.
- Changing selection sets `adminLayerId` in store, which triggers a re-load of the OL layer and resets `joinResult`.
- If a CSV is already loaded when the layer changes, show a warning: "Changing the admin layer will reset your column mapping. Continue?"

### Column mapping labels

Replace any label that says "Province" with a generic term. Either use the layer name dynamically or just use "Area" / "Feature".

### "Show labels" toggle (Style tab)

Rename from "Show province labels" → "Show feature labels" (or "Show area labels").

---

## Project Save / Load (`projectsService.js`)

### What to save

Add `adminLayerId` to `PERSIST_KEYS`. The `joinResult` (which contains `{ matched, unmatched, unmatchedKeys, valueMap }`) already has no geometry — `valueMap` is just `{ featureCode: rawValue }`. This is correct and sufficient.

Do **not** save `adminFeatures` — it is derived from the GeoJSON at load time.
Do **not** save the full GeoJSON — it lives in `public/data/` and is always available by `adminLayerId`.

### Loading a project

When a project is loaded:
1. Restore `adminLayerId` from saved state.
2. The `useAdminLayer` hook fires because `adminLayerId` changed, fetching the correct GeoJSON.
3. `joinResult.valueMap` is already in the store, so the map renders immediately once the layer is ready.
4. No re-join needed on load (the join result is persisted).

### Migration for existing projects

Existing cloud projects have no `adminLayerId` field. `normalizeProjectState` in `projectsService.js` should default it to `'idn-province'` if missing — preserving backward compatibility.

---

## `mapConstants.js` Changes

`INDONESIA_BBOX`, `INDONESIA_EXTENT_3857`, and `INDONESIA_PAN_EXTENT` remain but are no longer referenced in `useAdminLayer` for the initial extent. The pan constraint (`extent` on `ol/View`) should remain as Indonesia-wide for now (since all current layers are within Indonesia). If a layer outside Indonesia is added later, pan constraints become per-layer config.

---

## Sample Data

Add `public/samples/yogyakarta_hdi.csv` (or similar):

```csv
ADM2_PCODE,hdi
IDN.14.1_1,80.22
IDN.14.2_1,77.14
IDN.14.3_1,85.49
IDN.14.4_1,73.60
IDN.14.5_1,70.34
```

This lets users immediately test the new layer without preparing their own data.

---

## Download Example CSV

### Purpose

Users need to know exactly which IDs or names to put in their CSV before they can do anything useful. Rather than pointing them to documentation, generate a ready-to-fill template directly from the loaded GeoJSON features. The template shows both the feature ID and feature name columns side by side, so the user understands which format their data should follow.

### What the generated CSV looks like

For **Indonesia – Provinces** (`keyType = 'id'`):
```csv
ADM1_PCODE,province_name,value
ID-AC,Aceh,
ID-BA,Bali,
ID-BB,Kepulauan Bangka Belitung,
...
```

For **Yogyakarta – Cities/Regencies** (`keyType = 'id'`):
```csv
ADM2_PCODE,city_name,value
IDN.14.1_1,Kota Yogyakarta,
IDN.14.2_1,Bantul,
IDN.14.3_1,Sleman,
IDN.14.4_1,Kulon Progo,
IDN.14.5_1,Gunungkidul,
```

The `value` column is always empty — it is a placeholder the user fills in with their own data. The feature ID and name columns are read-only reference columns, labelled clearly with the actual field names from the layer config.

### Data source

The rows are generated from `adminFeatures` in the store (`[{ featureId, featureName }]`), which is already populated once the GeoJSON loads. No extra fetch is required.

### Implementation

Add a pure utility function in `src/utils/csvUtils.js` (or alongside the matcher):

```js
export function generateTemplateCsv(adminFeatures, layerConfig) {
  // adminFeatures: [{ featureId, featureName }]
  // layerConfig: { featureIdField, featureNameField }
  const header = [layerConfig.featureIdField, layerConfig.featureNameField, 'value']
  const rows = adminFeatures.map((f) => [f.featureId, f.featureName, ''])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}
```

Trigger download client-side using a Blob + temporary anchor element — no library needed:

```js
function downloadTemplateCsv(csvString, layerId) {
  const blob = new Blob([csvString], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${layerId}-template.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

### UI placement

Place a "Download template CSV" link/button directly below the layer selector in the Data tab, visible as soon as a layer is selected (i.e., `adminFeatures.length > 0`):

```
Admin Layer
[ Indonesia – Provinces          v ]
  Download template CSV
```

The button is disabled (or hidden) while the GeoJSON is still loading (i.e., `adminFeatures.length === 0`). Once features are loaded the button is active.

Use a small secondary style — it should feel like a helper hint, not a primary action. An icon (download arrow or table icon) alongside the text helps discoverability.

### Filename convention

`{layerId}-template.csv`, e.g.:
- `idn-province-template.csv`
- `idn-yogyakarta-city-template.csv`

### What this replaces

The static `public/samples/` CSV files are still useful for a one-click demo, but the template download covers a different need: users who have their own data and just need to know the exact IDs/names to match against. Both can coexist — the sample loads real demo data; the template is an empty scaffold.

---

## Implementation Order

1. **Add GeoJSON asset** — process and commit `public/data/yogyakarta_cities.geojson` + sample CSV. Verify file is <200 KB and renders correctly in QGIS or geojson.io.

2. **Add `adminLayers.js`** — define registry, move aliases there, export `getLayer()`.

3. **Update store** — rename fields, add `adminLayerId`, bump version + migration.

4. **Rename/refactor matcher** — `provinceMatcher.js` → `featureMatcher.js`, generalize signature, update all callers.

5. **Rename/refactor hook** — `useProvinceLayer.js` → `useAdminLayer.js`, make GeoJSON URL, feature fields, and extent dynamic.

6. **Update `projectsService.js`** — add `adminLayerId` to `PERSIST_KEYS`, update `normalizeProjectState` migration.

7. **Update UI** — add layer selector in Data tab, rename province-specific labels, add "Download template CSV" button below layer selector.

8. **Add `generateTemplateCsv` utility** — pure function in `csvUtils.js`, no dependencies.

9. **Run `npm run build`** — verify no TypeScript/lint errors, check bundle size.

10. **Manual test** — load Indonesia layer + province CSV, switch to Yogyakarta layer + city CSV, save project, reload project, verify template CSV downloads correctly for each layer.

---

## Open Questions

- Should switching layers reset the CSV too, or only reset the join? (Recommendation: reset join + column mapping but keep the raw CSV, so the user only re-selects columns.)
- Should the pan constraint (`INDONESIA_PAN_EXTENT`) be per-layer config? Currently all layers are in Indonesia so this is low priority.
- For the Yogyakarta layer, should `ADM2_PCODE` use GADM's `GID_2` format (`IDN.14.1_1`) or a shorter official BPS code? Using GADM's own IDs is simpler for now; BPS codes can be added as aliases later.
- Should `showFeatureLabels` be reset when switching layers? Recommendation: yes, reset to `false` since label density differs between province and city scales.
