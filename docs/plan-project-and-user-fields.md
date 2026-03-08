# Plan: Project Metadata & User Profiles

## Overview

Two related improvements:
1. **Richer project metadata** — description, thumbnail, tags, source attribution, license
2. **User profiles** — username, display name, bio, so public maps show meaningful attribution

---

## 1. Database Changes

### 1a. `projects` table — new columns

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `description` | `text` | yes | `null` | Free-text description of what the map shows |
| `thumbnail` | `text` | yes | `null` | Base64-encoded PNG, auto-generated from html2canvas on save |
| `tags` | `text[]` | yes | `'{}'` | Free-form labels, e.g. `['health', 'jawa-barat', '2024']` |
| `source_url` | `text` | yes | `null` | URL to the original dataset |
| `license` | `text` | yes | `null` | Data license string, e.g. `'CC BY 4.0'` |
| `admin_layer_id` | `text` | yes | `null` | Denormalized from state_json for gallery display without full load |
| `view_count` | `integer` | no | `0` | Incremented on each public view load |

Migration SQL:
```sql
alter table projects
  add column description text,
  add column thumbnail text,
  add column tags text[] default '{}',
  add column source_url text,
  add column license text,
  add column admin_layer_id text,
  add column view_count integer not null default 0;
```

### 1b. `profiles` table — new table

Auto-created on first login via a Postgres trigger. User can edit most fields later.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `uuid` PK | no | References `auth.users.id` |
| `username` | `text` UNIQUE | yes | URL-safe slug, e.g. `ismailsunni`. Chosen by user after first login. |
| `display_name` | `text` | yes | Pre-filled from Google `full_name`. User can override. |
| `bio` | `text` | yes | One-line description, shown on profile page |
| `website` | `text` | yes | Personal or org URL |
| `avatar_url` | `text` | yes | Pre-filled from Google `avatar_url`. User can override. |
| `created_at` | `timestamptz` | no | `now()` |

Migration SQL:
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  display_name text,
  bio text,
  website text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Row-level security
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup (works for both Google and email)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

> **Note:** Existing users (already in `auth.users`) won't have a profile row yet. A one-time backfill query is needed after the migration.

---

## 2. Backend / Service Changes

### `projectsService.js`

- `saveProject()` — add `description`, `tags`, `source_url`, `license`, `admin_layer_id`, `thumbnail` params
- `updateProject()` — already generic via `updates` object, no change needed
- `listPublicProjects()` — add `description`, `thumbnail`, `tags`, `admin_layer_id`, `view_count` to the select
- `listProjects()` — add same fields to select
- `incrementViewCount(id)` — new function, calls `rpc('increment_view_count', { project_id: id })` (Supabase RPC to safely increment)
- Add `thumbnail` to `PERSIST_KEYS`? No — thumbnail is generated separately, not from store state.

New `profilesService.js`:
- `getProfile(userId)` — fetch a profile row
- `updateProfile(userId, updates)` — update display_name, username, bio, website, avatar_url
- `isUsernameTaken(username)` — check uniqueness before saving

### `mapStore.js`

Add to store state (for the currently active project):
- `activeProjectDescription` — string
- `activeProjectTags` — array
- `activeProjectSourceUrl` — string
- `activeProjectLicense` — string

These get set when loading a project and saved when saving/updating.

---

## 3. UI Changes

### 3a. Save Project dialog

Currently: only asks for project name + public toggle.

Add:
- `description` — textarea, optional
- `tags` — comma-separated text input (or pill input), optional
- `source_url` — text input, optional, with link icon
- `license` — dropdown with common options: `CC BY 4.0`, `CC BY-SA 4.0`, `CC0`, `Open Government License`, `Custom...` (+ free text if Custom)
- Thumbnail is generated silently in the background using the existing `html2canvas` export

### 3b. Projects panel (My Projects)

Currently shows: name, date, public/private toggle, load/rename/delete.

Add:
- Small thumbnail preview (if available) as a left-side image
- Description (truncated to 2 lines)
- Tags as pill badges
- `source_url` as a small external link icon

### 3c. Gallery page

Currently shows: project name, date.

Add:
- Thumbnail as card cover image (full-width, fixed-height, fallback to a placeholder)
- Description below the name
- Tags as pill badges
- "by @username" attribution using profile data
- View count

### 3d. Map view (shared/public mode)

In view-only mode (`viewMode === 'view'`), show attribution:
- "by @username" linked to their profile (if username set)
- Source URL as a small link icon
- License text

### 3e. User profile settings (new page/modal)

Accessible from the header avatar/name button (currently just shows sign-out).

Fields:
- Avatar (from Google, not editable in v1 — just displayed)
- Display name (editable text input)
- Username (editable, with real-time uniqueness check + slug validation)
- Bio (editable textarea, max 160 chars)
- Website (editable text input)

Save button calls `updateProfile()`.

Username rules: lowercase letters, numbers, hyphens only (`/^[a-z0-9-]+$/`), 3–30 chars.

---

## 4. Priority / Phasing

### Phase 1 — High impact, low effort
1. DB: add `description`, `source_url`, `license` to `projects`
2. UI: expose these fields in the Save dialog and Projects panel
3. No profile table needed yet

### Phase 2 — User profiles
1. DB: create `profiles` table + trigger
2. Service: `profilesService.js`
3. UI: profile settings modal (username + display name at minimum)
4. Update gallery + shared map view to show "by @username"

### Phase 3 — Gallery enrichment
1. DB: add `thumbnail`, `tags`, `admin_layer_id`, `view_count` to `projects`
2. Auto-generate thumbnail on save using existing html2canvas
3. Tags input in Save dialog
4. Gallery card redesign with thumbnails + tags

---

## 5. Open Questions

- **Username requirement:** Should it be mandatory before saving a public project, or optional?
- **Thumbnail generation:** Auto on every save (slow), or on-demand (user clicks "Generate preview")?
- **Tags:** Free-form strings or a predefined list (e.g. by sector: health, economy, education)?
- **License:** Should it default to something (e.g. CC BY 4.0) or stay empty?
- **Profile page:** A dedicated `/u/:username` public page, or just inline attribution on map cards?
- **Backfill:** How to handle existing users who have no `profiles` row yet?
