# Product Requirements Document (PRD)

## Feature: User Data Upload & Styling

Project: Petakarta
Repository: https://github.com/ismailsunni/petakarta

---

# 1. Overview

This feature enables users to upload their own spatial data (initially GeoJSON), visualize it on the map, apply styling, save the configuration in a project, and share the map with others.

The feature introduces a **Data Panel** for dataset management and updates the **Styling System** so users can style **any layer**, not only admin layers.

This moves Petakarta toward a **user-driven WebGIS editor**.

---

# 2. Goals

1. Allow users to upload GeoJSON datasets.
2. Store uploaded files in Supabase Storage.
3. Register datasets in Supabase database.
4. Allow users to add uploaded datasets as map layers.
5. Allow styling of **any layer**, including user layers.
6. Allow project saving with dataset + style configuration.
7. Allow sharing of projects via URL.

---

# 3. Non-Goals (for MVP)

The following features are **not included in the first implementation**:

* Shapefile upload
* KML upload
* Dataset editing
* Attribute table editing
* Large dataset tiling
* Dataset sharing between users
* Dataset deletion history
* Advanced cartography (graduated/categorized styling)

---

# 4. User Stories

### Dataset Upload

User can upload a GeoJSON file so that it appears on the map.

**Flow**

User → Upload file
System → Upload to Supabase Storage
System → Save dataset metadata in database
System → Add layer to map

---

### Dataset Management

User can see a list of their uploaded datasets.

User can:

* add dataset to map
* remove layer from map
* rename dataset

---

### Styling Layers

User can select a layer and modify its style.

User can control:

* color
* stroke width
* fill color
* opacity
* point size

---

### Project Saving

User can save the current map configuration including:

* layers
* styles
* map view

---

### Map Sharing

User can share a URL to load the saved project.

---

# 5. UX Design

## Layout

Current UI will be extended with a **Data Panel**.

```
-----------------------------------
Layer Panel | Data Panel | Style
-----------------------------------
               Map
-----------------------------------
```

---

# 6. Data Panel

Purpose: manage datasets.

### Components

```
Data Panel
 ├ Upload Dataset
 ├ Dataset List
 │   ├ Add to map
 │   ├ Remove
 │   └ Rename
```

---

## Upload UI

```
Upload Dataset
--------------
[ Select GeoJSON file ]
[ Upload ]
```

After upload:

```
Dataset uploaded successfully
Add to map?
```

---

# 7. Styling Panel Changes

Current behavior:

```
style editor applies to admin layer only
```

New behavior:

```
user selects a layer
style editor applies to selected layer
```

### Layer Selection

Layer panel becomes the selector.

```
Layers
------
● Roads
○ Flood zones
○ Uploaded dataset
```

Selected layer → style editor applies.

---

# 8. Style Model

Style will be stored as JSON.

Example:

```
{
  "type": "polygon",
  "fill": "#2ECC71",
  "stroke": "#1E8449",
  "strokeWidth": 2,
  "opacity": 0.7
}
```

Point style:

```
{
  "type": "point",
  "color": "#E74C3C",
  "radius": 6
}
```

Line style:

```
{
  "type": "line",
  "color": "#3498DB",
  "width": 3
}
```

---

# 9. Database Schema

## datasets table

```
datasets
--------
id uuid
name text
owner uuid
storage_path text
geometry_type text
bbox jsonb
created_at timestamp
```

---

## projects table

```
projects
--------
id uuid
name text
owner uuid
config jsonb
created_at timestamp
```

---

## Example project config

```
{
  "layers": [
    {
      "datasetId": "abc123",
      "visible": true,
      "style": {
        "type": "polygon",
        "fill": "#2ECC71",
        "stroke": "#1E8449",
        "strokeWidth": 2
      }
    }
  ],
  "mapState": {
    "center": [110.37, -7.8],
    "zoom": 10
  }
}
```

---

# 10. Supabase Storage

Bucket:

```
datasets
```

File path structure:

```
datasets/{user_id}/{dataset_id}.geojson
```

Example:

```
datasets/uuid-user/uuid-dataset.geojson
```

---

# 11. Upload Flow

```
User selects GeoJSON
        ↓
Upload to Supabase Storage
        ↓
Insert dataset metadata into database
        ↓
Load dataset into OpenLayers
        ↓
Add as vector layer
```

---

# 12. Rendering Pipeline

```
Supabase storage
      ↓
fetch GeoJSON
      ↓
OpenLayers VectorSource
      ↓
VectorLayer
      ↓
Apply style JSON
```

---

# 13. Performance Constraints

For MVP:

```
Max file size: 10MB
Max features: ~50k
```

Future improvement:

```
vector tile conversion
```

---

# 14. Security

Use Supabase Row Level Security.

Policies:

Users can:

* insert datasets
* read their datasets
* update their datasets

Users cannot:

* access datasets of others

Projects may optionally be public.

---

# 15. API Usage (Supabase Client)

Upload:

```
supabase.storage
  .from("datasets")
  .upload(path, file)
```

Insert metadata:

```
supabase
  .from("datasets")
  .insert({...})
```

Fetch dataset:

```
supabase
  .storage
  .from("datasets")
  .download(path)
```

---

# 16. Components to Implement

Frontend components required:

```
DataPanel
DatasetUpload
DatasetList
LayerSelector
StyleEditor
ProjectManager
```

---

# 17. Development Phases

## Phase 1

Dataset upload + map display.

## Phase 2

Layer selection + styling.

## Phase 3

Project saving.

## Phase 4

Shareable maps.

---

# 18. Future Enhancements

Possible future upgrades:

* Shapefile upload
* Attribute table viewer
* Categorized styling
* Graduated styling
* Vector tile generation
* Dataset collaboration
* Public dataset library
* Style presets
* Layer ordering

---

# 19. Success Criteria

Feature considered successful when:

* user uploads GeoJSON
* dataset appears on map
* user can style the dataset
* project can be saved
* project can be shared

---

# 20. Risks

Large datasets may cause performance issues.

Mitigation:

* file size limits
* vector tile pipeline later
* lazy loading

---

# 21. Summary

This feature introduces **user datasets and styling** to Petakarta, transforming it from a map viewer into a **lightweight WebGIS editor**.

Core additions:

* Data panel
* GeoJSON upload
* Layer-based styling
* Project persistence

The design keeps the system simple while enabling future expansion into a full collaborative mapping platform.
