# PetaKarta v2 — Plan

**Vision:** A lightweight Indonesian geoportal, inspired by map.geo.admin.ch.
Browse government layers, add your own data, style maps, share results — all in the browser.

**Date:** 2026-03-28
**Status:** Draft

---

## Principles

1. **Client-only** — no custom backend beyond Supabase (auth, storage, DB)
2. **Indonesia-first** — admin layers, government data sources, Bahasa aliases
3. **Shareable** — every map has a URL; embedding is first-class
4. **Progressive** — works without sign-in (local layers), sign-in unlocks save/share
5. **Lite** — no 3D, no routing, no analysis. Just layers + styling + sharing

---

## Layer Architecture

Three layer types, unified in the existing layer tree store:

| Type | Source | Storage | User Stylable? | Example |
|---|---|---|---|---|
| **Admin** | Bundled GeoJSON in repo | None (static asset) | Yes — choropleth, graduated, categorized, single | Indonesia provinces, regencies |
| **Catalog** | WMS/WMTS URL from curated list | URL reference in project JSON | Limited — opacity, visibility | BIG RBI, BMKG weather |
| **User** | Uploaded GeoJSON or remote GeoJSON URL | Supabase Storage (upload) or URL reference (remote) | Yes — fill, stroke, graduated, categorized | User CSV join, uploaded boundaries |

### Catalog Layer Model

```js
// New layer type in layerTreeStore
{
  id: 'catalog-big-rbi-1711234567890',
  type: 'catalog',
  name: 'Peta Rupabumi Indonesia',
  title: '',             // User-editable display title
  visible: true,
  opacity: 0.7,
  order: 2,
  catalogConfig: {
    catalogId: 'big-rbi',    // Reference to CATALOG_LAYERS entry
    type: 'wms',             // 'wms' | 'wmts' | 'xyz'
    url: 'https://...',
    layers: 'provinsi_ar',   // WMS layer name(s)
    format: 'image/png',
    attribution: '© BIG',
  }
}
```

### Catalog Registry (static, in repo)

```
src/data/catalogLayers.js
```

A curated, hand-verified list of WMS/WMTS/XYZ endpoints. Each entry includes:
- `id`, `name`, `provider`, `category`
- `type` ('wms' | 'wmts' | 'xyz'), `url`, `layers`, `format`
- `attribution`, `thumbnail` (optional)
- `bbox` (for zoom-to-layer)
- `cors` (boolean — whether it works without proxy)

Start with services that have CORS or are tile-based. Government WMS without CORS is deferred to Phase 5 (proxy).

### CORS Status of Known Services

| Service | Type | CORS | Status |
|---|---|---|---|
| Esri World Imagery | XYZ tiles | ✅ Yes | Working |
| Esri World Topo | XYZ tiles | ✅ Yes | Working |
| OpenTopoMap | XYZ tiles | ✅ Yes | Working |
| CartoDB Light/Dark | XYZ tiles | ✅ Yes | Working |
| HOT OSM (openstreetmap.fr) | XYZ tiles | ✅ Yes | Working |
| BIG geoservices.big.go.id | WMS | ❌ No | 404 / no CORS |
| BIG palapa.big.go.id | WMS | ❌ No | Timeout |
| BIG tanahair.indonesia.go.id | WMS | ❌ No | Timeout |
| BMKG geoportal.bmkg.go.id | WMS | ❌ No | Timeout |
| BMKG inatews.bmkg.go.id | WMS | ❌ No | 404 |
| BNPB gis.bnpb.go.id | ArcGIS | ❌ No | 500 |
| KLHK geoportal.menlhk.go.id | ArcGIS | ❌ No | Timeout |
| KSP geoportal.ksp.go.id | WMS | ❌ No | Timeout |

**Conclusion:** Indonesian government WMS services are currently unreliable and lack CORS. Phase 2 starts with CORS-friendly tile services (basemaps, Esri). Government WMS requires a proxy (Phase 5).

---

## Sharing & URLs

### Project Visibility

| Level | Gallery? | URL accessible? | Use case |
|---|---|---|---|
| **Private** | No | Owner only | Work in progress |
| **Unlisted** | No | Anyone with link | Soft sharing |
| **Public** | Yes | Anyone | Published maps |

### URL Scheme

| URL | Purpose |
|---|---|
| `/petakarta/` | Editor (home) |
| `/petakarta/p/<slug>` | View project by slug (primary share URL) |
| `/petakarta/?project=<uuid>` | View project by UUID (backward compat) |
| `/petakarta/?project=<uuid>&embed=true` | Iframe embed (no header/footer) |
| `/petakarta/gallery` | Public project gallery |
| `/petakarta/about` | About page |

### Slug Rules

- **Globally unique** (not per-user)
- Auto-generated from project title: `Indonesia HDI 2024` → `indonesia-hdi-2024`
- If taken, append suffix: `indonesia-hdi-2024-2`
- User can edit slug in project settings
- Max 60 characters, lowercase, alphanumeric + hyphens only
- Reserved: `gallery`, `about`, `new`, `p`

---

## Database Changes

### Projects table — new/modified columns

```sql
ALTER TABLE projects
  ADD COLUMN slug TEXT UNIQUE,
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private',
    -- 'private' | 'unlisted' | 'public'
  ADD COLUMN description TEXT,
  ADD COLUMN thumbnail_url TEXT;

-- Migrate existing is_public to visibility
UPDATE projects SET visibility = 'public' WHERE is_public = true;
UPDATE projects SET visibility = 'private' WHERE is_public = false;

-- Index for slug lookups
CREATE UNIQUE INDEX idx_projects_slug ON projects(slug) WHERE slug IS NOT NULL;

-- Update RLS for visibility
-- Public/unlisted: anyone can SELECT
-- Private: only owner can SELECT
CREATE POLICY "Anyone can view public/unlisted projects"
  ON projects FOR SELECT
  USING (visibility IN ('public', 'unlisted') OR auth.uid() = user_id);
```

**Note:** Keep `is_public` column temporarily for backward compat, derive from `visibility`.

### Profiles table (new)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,         -- for public URLs, optional
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' (hidden, admin-set)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

**Tier system:**
- `free` — default, enforced limits (see User Limits below)
- `pro` — higher limits, set manually by admin (no payment flow yet)
- Tier is **not exposed in UI** — only used for limit enforcement
- Future: tier determines limits via a config map, not hardcoded

**Tier-based limits:**

| Resource | Free | Pro |
|---|---|---|
| Projects | 20 | 100 |
| Datasets | 10 | 50 |
| Total storage | 50 MB | 500 MB |
| Max single file | 10 MB | 50 MB |

### Datasets table — add limits

```sql
-- Per-user dataset count limit (10)
CREATE POLICY "Users limited to 10 datasets"
  ON datasets FOR INSERT
  WITH CHECK (
    auth.uid() = owner
    AND (SELECT count(*) FROM datasets WHERE owner = auth.uid()) < 10
  );
```

Storage size limit (50MB total per user) enforced in application code since Supabase RLS can't easily query storage bucket sizes.

### User Limits (tier-based)

| Resource | Free | Pro |
|---|---|---|
| Projects | 20 | 100 |
| Datasets (GeoJSON uploads) | 10 | 50 |
| Total storage | 50 MB | 500 MB |
| Max single file | 10 MB | 50 MB |
| Slug | 1 per project, globally unique | same |

Limits are enforced via RLS policies that join to `profiles.tier`. The tier column is only writable by service role (admin), not by users.

---

## Phases

### Phase 1: Project Management & Sharing

**Goal:** Make saving and sharing smooth. This is the foundation everything else builds on.

**Tasks:**

1.1. **Save project UX** (petakarta-slp)
  - Save / Save As / Rename / New Project toolbar in header
  - Keyboard shortcut: Ctrl+S to save
  - See `PLAN-save-project.md` for detailed spec (update to use layerTreeStore)

1.2. **Project slug support**
  - Add `slug` column to projects table (migration)
  - Auto-generate slug from title on save
  - Resolve slug in App.jsx routing (`/p/<slug>`)
  - Slug uniqueness validation

1.3. **Visibility model**
  - Replace `is_public` boolean with `visibility` enum ('private', 'unlisted', 'public')
  - UI: dropdown in project settings (save modal or header)
  - Update RLS policies

1.4. **Embed snippet generator**
  - "Share" button/tab with:
    - Copy URL button
    - Copy `<iframe>` snippet with configurable width/height
    - QR code (optional, nice-to-have)
  - Only available for unlisted/public projects

1.5. **Per-user limits**
  - Enforce dataset count via RLS
  - Enforce project count via RLS
  - Show usage in UI (e.g. "3/10 datasets used")
  - Application-side storage size check on upload

1.6. **OG meta tags for shared projects**
  - Dynamic `<meta>` tags (title, description, image) for shared URLs
  - Requires either: server-side rendering for the meta tags, or a Supabase Edge Function that serves an HTML shell with meta tags then redirects to the SPA
  - Use thumbnail_url if available, otherwise a default PetaKarta preview image

1.7. **User profiles**
  - Create `profiles` table with trigger (auto-create on signup)
  - Populate `full_name` and `avatar_url` from Google OAuth metadata on signup
  - Profile settings page or modal: edit full name, username
  - Show author name on public project cards in gallery
  - `tier` column: 'free' (default) or 'pro' — admin-set only, not visible to users
  - Tier drives limit enforcement (project count, dataset count, storage)
  - Add `profilesService.js` for CRUD
  - Update `authStore` to fetch/cache profile on login
  - For existing users: backfill profiles via a one-time migration script

**Dependencies:** None — this phase is self-contained.

### Phase 2: Basemap Expansion & Catalog Foundation

**Goal:** More basemap choices + the infrastructure for catalog layers.

**Tasks:**

2.1. **Expand basemap options**
  - Current: OSM only
  - Add: Esri World Imagery (satellite), Esri World Topo, OpenTopoMap, CartoDB Light, CartoDB Dark
  - All have CORS ✅
  - Update basemap switcher UI

2.2. **Catalog layer type in layer tree**
  - Add `catalog` type to layerTreeStore
  - Catalog layers store config (url, type, layers, attribution) — no data blob
  - OL integration: `TileWMS`, `WMTS`, or `XYZ` source based on catalog entry type
  - Persist in project JSON (just the catalogConfig, not tiles)

2.3. **Static catalog registry**
  - Create `src/data/catalogLayers.js` with curated entries
  - Start with CORS-friendly tile services only:
    - Esri services (World Imagery, World Topo, NatGeo)
    - OpenTopoMap overlays
    - Any verified Indonesian service with CORS
  - Structure supports future WMS additions

2.4. **"Add Layer → Browse Catalog" UI**
  - New tab in AddLayerModal: "Catalog"
  - Searchable/filterable list grouped by category
  - Click to add to layer tree
  - Preview thumbnail per entry

2.5. **Custom XYZ/WMS URL input**
  - "Add Layer → Custom URL" tab
  - User enters: URL template, type (XYZ/WMS), layer name (if WMS)
  - Validates connection before adding
  - For advanced users who know their own WMS endpoints

**Dependencies:** Phase 1 (project save must work to persist catalog layers).

### Phase 3: Styling & Data Improvements

**Goal:** Better styling options and data input flexibility.

**Tasks:**

3.1. **Remote GeoJSON URL as layer source**
  - "Add Layer → URL" option: paste a GeoJSON URL
  - Fetches and renders like an uploaded dataset
  - Stored as URL reference in project JSON (no upload to Supabase)
  - Re-fetched on project load
  - CORS required on the source

3.2. **Attribution/source field** (petakarta-03s)
  - Text input for data source attribution
  - Displayed on map canvas and in exports
  - Per-project (not per-layer)

3.3. **Color ramp picker upgrade** (petakarta-8ea)
  - Grouped dropdown: Sequential, Diverging, Qualitative
  - Color preview swatches per option
  - More ramps from chroma.js brewer scales

3.4. **Improved vector styling**
  - Line layers: dash pattern options, width control
  - Point layers: size by value (graduated symbols)
  - Polygon: border-only style option
  - Label: font size control, color

3.5. **CSV/data join improvements**
  - Support joining data to any vector layer (not just admin layers)
  - Column auto-detection improvements
  - Data preview table

**Dependencies:** Phase 2 (catalog layers in place, styling applies to all layer types).

### Phase 4: Output & Social

**Goal:** High-quality exports and social sharing.

**Tasks:**

4.1. **Print-quality PNG export**
  - DPI selector: 72 (screen), 150 (web), 300 (print)
  - Paper size presets: A4 landscape, A3, custom
  - Scale bar in export
  - Investigate inkmap (petakarta-zx4) vs custom canvas rendering

4.2. **Thumbnail generation on save**
  - Auto-capture map canvas as thumbnail on project save
  - Store as small PNG in Supabase Storage (or base64 in projects table)
  - Used for: gallery cards, OG preview images, embed previews

4.3. **Social sharing** (petakarta-cax)
  - Share buttons: Twitter/X, Facebook, LinkedIn, WhatsApp
  - Web Share API where available
  - Share image (exported PNG) or share link

4.4. **Gallery improvements**
  - Thumbnail grid view
  - Search/filter by title, description
  - Sort by newest, most viewed
  - Pagination

**Dependencies:** Phase 1 (sharing URLs), Phase 3 (attribution in exports).

### Phase 5: Government Data (requires proxy)

**Goal:** Bring Indonesian government WMS/WMTS layers into the catalog.

**Tasks:**

5.1. **CORS proxy**
  - Supabase Edge Function that proxies WMS GetMap/GetCapabilities requests
  - Allowlist of approved government domains (security)
  - Caching headers for tile responses
  - Rate limiting per user

5.2. **Verify and catalog government WMS endpoints**
  - BIG (Badan Informasi Geospasial) — admin boundaries, topography, RBI
  - BMKG — weather, seismic, climate
  - KLHK — forest cover, land use, conservation
  - BNPB/InaRISK — disaster risk
  - BPS — statistical boundaries
  - Test each endpoint, document available layers, verify data quality

5.3. **WMS GetCapabilities parser**
  - For custom WMS URLs: fetch capabilities, parse available layers
  - Let user pick which sub-layer(s) to add
  - Auto-detect CRS, bbox, format

5.4. **Expand catalog**
  - Add verified government layers to catalog registry
  - Category: Administrative, Environment, Disaster, Climate, Statistics
  - Thumbnails for each

**Dependencies:** Phase 2 (catalog infrastructure), proxy deployment.

---

## File Structure Changes

```
src/
  data/
    catalogLayers.js          # NEW — curated catalog registry
    adminLayers.js            # existing — rename from utils/
  store/
    layerTreeStore.js         # MODIFY — add catalog layer type, slug, visibility
    authStore.js              # existing
  lib/
    projectsService.js        # MODIFY — slug generation, visibility
    datasetsService.js        # MODIFY — limit enforcement (tier-aware)
    profilesService.js        # NEW — profile CRUD, tier lookup
    supabase.js               # existing
    catalogService.js         # NEW — catalog layer OL source creation
  hooks/
    useAdminLayer.js          # existing
    useUserLayers.js          # existing
    useCatalogLayers.js       # NEW — manage catalog layers on map
    useMapInstance.js          # existing
    useMapExport.js            # existing
    useAppRoute.js             # MODIFY — slug routing
  components/
    ErrorBoundary.jsx          # existing (just added)
    Header.jsx                 # MODIFY — project toolbar
    Layers/
      AddLayerModal.jsx        # MODIFY — add Catalog tab, Custom URL tab
      CatalogBrowser.jsx       # NEW
      LayerTreePanel.jsx       # existing
      LayerItem.jsx            # MODIFY — catalog layer display
    Sidebar/
      ShareTab.jsx             # NEW — replaces/extends ExportTab
      StyleTab.jsx             # MODIFY — catalog layer style (limited)
    Map/
      MapView.jsx              # MODIFY — catalog layer rendering
    Projects/
      ProjectsPanel.jsx        # MODIFY — browse-focused
    Profile/
      ProfileModal.jsx         # NEW — edit full name, username
    Gallery/
      GalleryPage.jsx          # MODIFY — thumbnails, search, author name
```

---

## Migration Path

The existing app continues working throughout. Each phase is additive:

1. **Phase 1** — no breaking changes, just new columns + UI
2. **Phase 2** — new layer type, existing layers unaffected
3. **Phase 3** — styling enhancements, backward compatible
4. **Phase 4** — export improvements, no schema changes
5. **Phase 5** — proxy + catalog expansion, optional

Project JSON (`state_json`) versioning: add a `version` field to the stored state. The `loadProject` normalizer already exists — extend it to handle migrations between versions.

---

## Out of Scope (for now)

- 3D / globe view
- Routing / network analysis
- Spatial analysis (buffer, intersect, etc.)
- WFS support
- PDF export
- Payment/billing for pro tier (admin-set for now)
- Comments / collaboration on maps
- Version history / undo
- Mobile app
