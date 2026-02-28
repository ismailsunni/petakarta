import { transformExtent } from 'ol/proj'

// Tight bounding box around Indonesia (lon/lat)
export const INDONESIA_BBOX = [94.5, -11.5, 141.5, 6.5]

// Same bbox in EPSG:3857 for OL view operations
export const INDONESIA_EXTENT_3857 = transformExtent(INDONESIA_BBOX, 'EPSG:4326', 'EPSG:3857')

// Padded extent to constrain panning (slightly larger than the bbox)
export const INDONESIA_PAN_EXTENT = transformExtent([90, -15, 145, 10], 'EPSG:4326', 'EPSG:3857')

// Consistent padding for fit operations
export const FIT_PADDING = [20, 20, 20, 20]
