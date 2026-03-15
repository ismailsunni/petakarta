# Layer Tree Implementation Plan

## Overview

Implement a QGIS-style layer tree for managing map layers with unified support for admin layers and user datasets.

## Features

- **Layer Tree Panel** - List of layers with drag-drop reordering
- **Per-layer controls** - Visibility toggle, opacity slider, remove
- **Add Layer Modal** - Tabs for Admin Layers and My Datasets
- **Per-layer styling** - Style editor applies to selected layer
- **Project saving** - Full layer tree saved/loaded with projects

## Files to Create

### 1. `src/store/layerTreeStore.js`

Unified store replacing layer state from `mapStore` and `datasetsStore`.

**Layer Structure:**
```javascript
{
  id: string,              // Unique layer ID
  type: 'admin' | 'user',  // Layer type
  name: string,            // Display name
  visible: boolean,        // Layer visibility
  opacity: number,         // 0-1 opacity
  order: number,           // Z-index order (higher = on top)
  
  // For admin layers:
  adminConfig: {
    adminLayerId: string,
    featureValues: {},
    styleMode: 'graduated' | 'categorized',
    colorPreset, classMethod, numClasses, etc.
  },
  
  // For user layers:
  userConfig: {
    datasetId: string,
    geojson: object,
    geometryType: string,
    bbox: number[],
    style: { fill, stroke, opacity, etc. }
  }
}
```

**Actions:**
- `addAdminLayer(adminLayerId)` - Add admin layer (unique check)
- `addUserLayer(dataset, geojson)` - Add user layer (unique check)
- `removeLayer(layerId)`
- `toggleVisibility(layerId)`
- `setOpacity(layerId, opacity)`
- `reorderLayers(fromIndex, toIndex)`
- `moveLayerUp(layerId)` / `moveLayerDown(layerId)`
- `selectLayer(layerId)`
- `updateAdminConfig(layerId, updates)`
- `updateUserStyle(layerId, styleUpdates)`
- `getProjectState()` / `loadProject(state)`

### 2. `src/components/Layers/LayerTreePanel.jsx`

Main layer tree UI component.

**Features:**
- Sorted layer list (bottom to top like QGIS)
- Visibility checkbox per layer
- Opacity slider (on hover or expand)
- Selection highlight for styling
- Move up/down buttons
- Remove button
- "Add Layer" button → opens modal

### 3. `src/components/Layers/AddLayerModal.jsx`

Modal for adding new layers.

**Tabs:**
1. **Admin Layers** - Searchable list of ADMIN_LAYERS
2. **My Datasets** - User's uploaded datasets from Supabase

### 4. `src/components/Layers/LayerItem.jsx`

Individual layer row component.

**Elements:**
- Drag handle
- Visibility toggle (eye icon)
- Layer type icon (polygon/line/point)
- Layer name
- Opacity slider (expandable)
- Actions (move up/down, remove)

## Files to Modify

### 1. `src/hooks/useAdminLayer.js`

**Current:** Single admin layer from `mapStore.adminLayerId`
**New:** Multiple admin layers from `layerTreeStore.layers`

**Changes:**
- Loop through admin layers in tree
- Create separate VectorLayer per admin layer
- Apply per-layer opacity
- Apply per-layer z-index from order
- React to per-layer style changes

### 2. `src/hooks/useUserLayers.js`

**Current:** Reads from `datasetsStore.userLayers`
**New:** Reads from `layerTreeStore.layers` (type === 'user')

**Changes:**
- Filter layers by type === 'user'
- Apply opacity from layer config
- Apply z-index from layer order

### 3. `src/components/Sidebar/Sidebar.jsx`

**Current:** 4 tabs - Data, Datasets, Style, Export
**New:** 3 tabs - Layers, Style, Export

**Changes:**
- Replace Data + Datasets tabs with single Layers tab
- Layers tab contains LayerTreePanel

### 4. `src/components/Sidebar/StyleTab.jsx`

**Changes:**
- Remove layer target selector (now uses tree selection)
- Read selected layer from `layerTreeStore`
- Show admin style controls for admin layers
- Show user style controls for user layers

### 5. `src/lib/projectsService.js`

**Changes:**
- Save `layerTreeStore.getProjectState()` instead of mapStore
- Load project into `layerTreeStore.loadProject()`

### 6. `src/components/Map/MapView.jsx`

**Changes:**
- Ensure both hooks receive proper layer data

## Migration Notes

- No backward compatibility needed (prototype mode)
- Can delete old `mapStore` layer-related state after migration
- Can simplify `datasetsStore` to only handle Supabase datasets

## Implementation Order

1. Create `layerTreeStore.js`
2. Create `LayerItem.jsx`
3. Create `LayerTreePanel.jsx`
4. Create `AddLayerModal.jsx`
5. Modify `useAdminLayer.js`
6. Modify `useUserLayers.js`
7. Modify `Sidebar.jsx`
8. Modify `StyleTab.jsx`
9. Modify `projectsService.js`
10. Test and iterate
