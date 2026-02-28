const ALIASES = {
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
}

function normalize(str) {
  return String(str).toLowerCase().replace(/[^\w\s]/g, '').trim()
}

export function matchProvinces(csvData, keyColumn, keyType, valueColumn, provinceNames) {
  // provinceNames: array of { ADM1_PCODE, province_name } from GeoJSON features
  const valueMap = {}
  const unmatchedKeys = []

  // Build lookup maps from GeoJSON features
  const pcodeSet = new Set(provinceNames.map(p => p.ADM1_PCODE.toUpperCase()))
  const nameToCode = {}
  for (const p of provinceNames) {
    nameToCode[normalize(p.province_name)] = p.ADM1_PCODE
  }

  for (const row of csvData) {
    const rawKey = row[keyColumn]
    const value = row[valueColumn]

    if (rawKey == null || rawKey === '' || value == null || value === '') continue

    let pcode = null

    if (keyType === 'id') {
      const upper = String(rawKey).toUpperCase().trim()
      if (pcodeSet.has(upper)) {
        pcode = upper
      }
    } else {
      // Name matching
      const norm = normalize(rawKey)

      // 1. Direct match on province_name
      if (nameToCode[norm]) {
        pcode = nameToCode[norm]
      }

      // 2. Alias lookup
      if (!pcode && ALIASES[norm]) {
        pcode = ALIASES[norm]
      }
    }

    if (pcode) {
      valueMap[pcode] = Number(value)
    } else {
      unmatchedKeys.push(rawKey)
    }
  }

  const matched = Object.keys(valueMap).length
  const unmatched = unmatchedKeys.length

  return { matched, unmatched, unmatchedKeys, valueMap }
}
