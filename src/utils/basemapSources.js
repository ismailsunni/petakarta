import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'

export const BASEMAP_OPTIONS = [
  { key: 'osm', label: 'OpenStreetMap' },
  { key: 'cartodb-positron', label: 'Positron (Light)' },
  { key: 'cartodb-dark', label: 'Dark Matter' },
  { key: 'cartodb-voyager', label: 'Voyager' },
  { key: 'none', label: 'No Basemap' },
]

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function cartoXYZ(style) {
  return new XYZ({
    url: `https://{a-d}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`,
    attributions: CARTO_ATTRIBUTION,
    maxZoom: 20,
  })
}

export function createBasemapSource(key) {
  switch (key) {
    case 'osm':
      return new OSM()
    case 'cartodb-positron':
      return cartoXYZ('light_all')
    case 'cartodb-dark':
      return cartoXYZ('dark_all')
    case 'cartodb-voyager':
      return cartoXYZ('rastertiles/voyager')
    default:
      return null
  }
}
