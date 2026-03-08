# Plan: About & Informational Pages

## Current state

The app has a thin header (logo, Gallery link, Sign In, GitHub icon) and a one-line footer
(`Data: GADM 4.1 · Built with OpenLayers · © 2026`). There are no informational pages beyond
the map editor and gallery.

---

## Suggested pages / sections

### 1. About (`?page=about`)

The most expected page for any web app. Covers:

- **What is PetaKarta** — one paragraph, plain language. "A free, browser-only tool for making
  choropleth maps of Indonesian provinces and regencies. No account needed, no data leaves your
  browser."
- **Why it exists** — the problem it solves (existing tools are complex, require GIS knowledge,
  or cost money)
- **Who made it** — author name, affiliation if any, contact link
- **How to cite** — for academic users who use a map they made here in a paper or report
- **GitHub link** — already in the header, but repeat it here with more context (open source,
  contributions welcome)

---

### 2. How to Use / Getting Started (`?page=guide`)

A step-by-step walkthrough for first-time users. The app has no onboarding at all right now.

Sections:
1. **Prepare your data** — what a valid CSV looks like, which columns are required, ID vs name
   matching, download template CSV tip
2. **Upload and map** — drag & drop or browse, select key column and value column, click Apply
3. **Style your map** — color ramps, classification methods (quantile, jenks, equal interval),
   number of classes
4. **Export** — PNG export, what the export bounds box does
5. **Save & share** — sign in required, public vs private, share link

Format: could be a simple long-scroll page with numbered sections, or a tabbed mini-tutorial.
Screenshots or animated GIFs would help a lot but can be added later.

---

### 3. FAQ (`?page=faq` or a section inside About)

Anticipated questions based on the app's current constraints:

- *"Does my data get uploaded to a server?"* — No, CSV processing happens entirely in the
  browser. Only saved projects (if you choose to save) are stored in the database.
- *"Which file formats are supported?"* — CSV only. No XLSX, no Shapefile, no JSON.
- *"Why doesn't my province name match?"* — Name matching is fuzzy but not perfect. Use the
  ID column (ADM1_PCODE / kode) for exact matching. Download the template CSV to see the
  expected names.
- *"Can I use this for regency-level data?"* — Yes, select the province from the Regencies
  group in the layer picker.
- *"Can I embed the map on my website?"* — Not yet (iframe embed is a future feature). You
  can share a link to the view-only mode.
- *"The colors look wrong when I export."* — Make sure to click Apply before exporting.
- *"Is PetaKarta free?"* — Yes, fully free. No paid tier.

---

### 4. Changelog / What's New (`?page=changelog`)

A reverse-chronological list of releases. Useful for:
- Returning users who want to know what changed
- Building trust ("this project is actively maintained")
- Pairing with the app versioning we discussed separately

Format: simple markdown-rendered list grouped by version/date.

Example entry:
```
## v1.2.0 — March 2026
- Added regency-level maps for all 38 provinces
- Searchable layer picker replaces two-dropdown UI
- Manual data entry: type values directly without a CSV

## v1.1.0 — February 2026
- Gallery page for public maps
- Save & share projects (requires sign in)
```

---

### 5. Privacy Policy (`?page=privacy`)

Required if you collect any user data (email via Google login, saved projects). Keep it short
and plain-language. Key points to cover:

- What is collected: email address, Google display name/avatar (on sign in), project data
  (maps you choose to save)
- What is NOT collected: CSV data you upload (never leaves the browser unless you save)
- Who can see your data: only you, unless you mark a project as public
- Third parties: Supabase (database host), Google (OAuth provider)
- Data deletion: how a user can delete their account and data
- Contact for privacy questions

---

### 6. Credits / Acknowledgements (section inside About or standalone)

Acknowledge the open-source tools and data sources the app depends on:

| Item | What it's used for |
|---|---|
| OpenLayers | Map rendering |
| GADM 4.1 | Original province boundary data (now replaced by new GeoJSON) |
| laravel-nusa / BPS | Source of the new province & regency GeoJSON |
| chroma.js | Color ramps |
| simple-statistics | Jenks natural breaks, quantile classification |
| PapaParse | CSV parsing |
| Tailwind CSS | Styling |
| Supabase | Auth and project storage |
| Vite + React | Build tooling |

---

## Where to put these

### Option A — Separate pages (current routing pattern)

The app already uses `?page=gallery` for the gallery. Follow the same pattern:
- `?page=about`
- `?page=guide`
- `?page=faq`
- `?page=changelog`
- `?page=privacy`

Simple to implement with the existing `useAppRoute` hook.

### Option B — Single "About" page with anchor sections

All content on one long page (`?page=about`), with in-page anchor links in a sidebar or
top nav (`#guide`, `#faq`, `#changelog`, `#privacy`). Less navigation overhead, easier to
maintain.

**Recommendation:** Option B. PetaKarta is a focused tool, not a content-heavy site. One
well-organized About page covers all of the above without over-engineering the routing.

---

## Footer improvements

The current footer is one line. Expand it to two sections:

**Left / center:** existing credits (`Data: GADM 4.1 · Built with OpenLayers · © 2026`)

**Right:** navigation links
- About
- How to Use
- Privacy Policy
- GitHub

This gives every page a consistent escape hatch to informational content without cluttering
the header.

---

## Header improvements

Add an "About" or "?" link in the header next to "Gallery". Alternatively, collapse
secondary links (Gallery, About, Guide) into a hamburger/menu on mobile.

---

## Priority

| Page | Priority | Effort |
|---|---|---|
| About (what + who + credits) | High | Low |
| Privacy Policy | High (needed for Google OAuth) | Low |
| How to Use / Guide | High (no onboarding exists) | Medium |
| FAQ | Medium | Low |
| Changelog | Medium | Low (if versioning is added) |

---

## Open Questions

- **Content author:** Will the About/Guide content be written by you, or should a draft be
  generated as part of implementation?
- **Language:** Indonesian, English, or both? The app UI is currently English only.
- **Guide format:** Static text, or an interactive walkthrough (tooltip overlay on the map
  editor)?
- **Legal:** Is a Terms of Service needed in addition to the Privacy Policy?
