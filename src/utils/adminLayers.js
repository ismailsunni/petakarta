export const ADMIN_LAYERS = [
  {
    id: 'idn-province',
    name: 'Indonesia – Provinces',
    geojsonPath: 'data/indonesia_provinces.geojson',
    featureIdField: 'ADM1_PCODE',
    featureNameField: 'province_name',
    bbox: [94.5, -11.5, 141.5, 6.5],
    samples: [
      { key: 'gdp', label: 'GDP per Capita', file: 'sample_gdp_per_capita.csv', keyCol: 'province_name', keyType: 'name', valueCol: 'gdp_per_capita_2023' },
      { key: 'hdi', label: 'Human Development Index', file: 'sample_hdi.csv', keyCol: 'pcode', keyType: 'id', valueCol: 'hdi_2023' },
      { key: 'pop', label: 'Population Density', file: 'sample_population_density.csv', keyCol: 'province_name', keyType: 'name', valueCol: 'pop_density' },
      { key: 'island', label: 'Island Group', file: 'sample_island_group.csv', keyCol: 'province_name', keyType: 'name', valueCol: 'island_group' },
    ],
    aliases: {
      'yogyakarta': 'ID-YO',
      'di yogyakarta': 'ID-YO',
      'diy': 'ID-YO',
      'jakarta': 'ID-JK',
      'dki jakarta': 'ID-JK',
      'jakarta raya': 'ID-JK',
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
      'babel': 'ID-BB',
      'kepulauan bangka belitung': 'ID-BB',
      'bangka belitung': 'ID-BB',
    },
    level: 'province',
  },
  {
    id: 'idn-yogyakarta-city',
    name: 'Yogyakarta – Cities/Regencies',
    geojsonPath: 'data/yogyakarta_cities.geojson',
    featureIdField: 'ADM2_PCODE',
    featureNameField: 'city_name',
    bbox: [110.0, -8.2, 110.8, -7.6],
    samples: [
      { key: 'yogya_hdi', label: 'HDI', file: 'yogyakarta_hdi.csv', keyCol: 'ADM2_PCODE', keyType: 'id', valueCol: 'hdi' },
    ],
    aliases: {},
    level: 'city',
  },
]

export const DEFAULT_LAYER_ID = 'idn-province'

export function getLayer(id) {
  return ADMIN_LAYERS.find((l) => l.id === id) ?? ADMIN_LAYERS[0]
}
