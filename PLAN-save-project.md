# Save Project Feature — Implementation Plan

## Context

PetaKarta already has basic project save/load via Supabase (cloud only, authenticated users). The current UX puts everything in a single "My Projects" modal: a text input to "Save as" a new project, an "Update current project" link, and a list of projects to load/delete. This plan upgrades the project management to a standard document-oriented workflow: **Save, Save As, Rename, New Project** — with quick-access buttons in the header toolbar.

## Current State

- `ProjectsPanel.jsx` — modal with save-as, update, load, delete, toggle public, copy link
- `projectsService.js` — Supabase CRUD: `saveProject`, `updateProject`, `loadProject`, `listProjects`, `deleteProject`, `extractProjectState`
- `mapStore.js` — holds `activeProjectId`, `activeProjectPublic`; no project name tracked in store
- `Header.jsx` — shows "My Projects" button (opens modal), sign in/out

## Changes

### 1. Add `activeProjectName` to Zustand store

**File:** `src/store/mapStore.js`

- Add `activeProjectName: ''` to state
- Add `setActiveProjectName` action
- Do NOT persist it (like `activeProjectId`, it's session state)
- Update `resetData()` to also clear `activeProjectName`

### 2. Add project toolbar to Header

**File:** `src/components/Header.jsx`

Replace the current simple "My Projects" button with a project toolbar (only shown when user is signed in):

```
[PetaKarta] [project-name ▼] [Save] [⋮ menu]     [user@email] [Sign Out] [GitHub]
```

- **Project name display**: Shows `activeProjectName` or "Untitled" if no project loaded. Clicking opens inline rename (editable text field that blurs to save).
- **Save button**: Saves to current project if one is active. If no active project, behaves like "Save As" (prompts for name).
- **Overflow menu (⋮)**: Contains "Save As...", "New Project", "My Projects"
  - **Save As...** — opens a small name prompt, creates a new project copy
  - **New Project** — calls `resetData()`, clears `activeProjectId/Name/Public`
  - **My Projects** — opens the existing ProjectsPanel modal

### 3. Refactor ProjectsPanel for browsing focus

**File:** `src/components/Projects/ProjectsPanel.jsx`

- Remove the "Save as" input from the top (that's now in the header menu)
- Remove the "Update current project" link (that's now the header Save button)
- Keep: project list with Load, Delete, toggle public, copy share link
- Add: Rename action per project (inline edit on project name)
- Show which project is currently active (highlight + "Active" badge)

### 4. Update projectsService with rename

**File:** `src/lib/projectsService.js`

- Add `renameProject(id, newName)` — calls `updateProject(id, { name: newName })`
  (This is a thin wrapper for clarity, or we just use `updateProject` directly)

### 5. Wire up project name on load

**File:** `src/components/Projects/ProjectsPanel.jsx`

- When `handleLoad` succeeds, also call `setActiveProjectName(data.name)`

**File:** `src/App.jsx`

- When loading a shared project via URL param, also set `activeProjectName` from loaded data

### 6. Wire up Save / Save As logic

New helper in `projectsService.js` or inline in Header:

- **Save**: If `activeProjectId` exists → `updateProject(activeProjectId, { state_json: extractProjectState(...) })`. If not → trigger Save As flow.
- **Save As**: Prompt for name → `saveProject(userId, name, state)` → set `activeProjectId`, `activeProjectName`, `activeProjectPublic` from response.

## Files Modified

| File | Change |
|------|--------|
| `src/store/mapStore.js` | Add `activeProjectName` + setter |
| `src/components/Header.jsx` | Project toolbar with Save, menu, inline rename |
| `src/components/Projects/ProjectsPanel.jsx` | Remove save UI, add per-project rename, browse-focused |
| `src/lib/projectsService.js` | Minor: ensure `saveProject` returns created project data (already does) |
| `src/App.jsx` | Set `activeProjectName` when loading shared project |

## UX Flow Summary

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Save** | Header Save button or Ctrl+S | Update existing project; if none active, prompt for name (Save As) |
| **Save As** | Header ⋮ → "Save As..." | Always prompts for name, creates new project, switches active to it |
| **Rename** | Click project name in header | Inline editable text, blur/enter saves to Supabase |
| **New Project** | Header ⋮ → "New Project" | Resets all data/style state, clears active project |
| **My Projects** | Header ⋮ → "My Projects" | Opens browsing modal (load, delete, toggle public, copy link) |
| **Load** | ProjectsPanel → Load button | Loads project state, sets active project ID/name |

## Verification

1. `npm run build` — ensure no build errors
2. Manual test flow:
   - Sign in → upload CSV → style map → Save (should prompt for name since no active project)
   - Modify style → Save (should update silently)
   - Save As → enter new name → verify new project in list
   - Click project name in header → rename → verify updated in My Projects
   - New Project → verify state reset, no active project
   - My Projects → load a project → verify state restored and header shows name
   - Load shared project via `?project=id` → verify name shows correctly
