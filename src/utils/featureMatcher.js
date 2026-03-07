function normalize(str) {
  return String(str).toLowerCase().replace(/[^\w\s]/g, '').trim()
}

export function matchFeatures(csvData, keyColumn, keyType, valueColumn, adminFeatures, layerConfig) {
  // adminFeatures: [{ featureId, featureName }]
  // layerConfig: { featureIdField, featureNameField, aliases }
  const valueMap = {}
  const unmatchedKeys = []
  const aliases = layerConfig.aliases ?? {}

  const idSet = new Set(adminFeatures.map((f) => String(f.featureId).toUpperCase()))
  const nameToId = {}
  for (const f of adminFeatures) {
    nameToId[normalize(f.featureName)] = f.featureId
  }

  for (const row of csvData) {
    const rawKey = row[keyColumn]
    const value = row[valueColumn]

    if (rawKey == null || rawKey === '' || value == null || value === '') continue

    let featureId = null

    if (keyType === 'id') {
      const upper = String(rawKey).toUpperCase().trim()
      if (idSet.has(upper)) {
        featureId = upper
      }
    } else {
      const norm = normalize(rawKey)

      if (nameToId[norm]) {
        featureId = nameToId[norm]
      }

      if (!featureId && aliases[norm]) {
        featureId = aliases[norm]
      }
    }

    if (featureId) {
      valueMap[featureId] = value
    } else {
      unmatchedKeys.push(rawKey)
    }
  }

  const matched = Object.keys(valueMap).length
  const unmatched = unmatchedKeys.length

  return { matched, unmatched, unmatchedKeys, valueMap }
}
