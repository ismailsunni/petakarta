# PetaKarta

**Visualize Indonesia, Province by Province**

A zero-signup, client-only choropleth map tool for Indonesian provincial statistics. Upload a CSV with province data (GDP, HDI, population, etc.) and produce a publication-ready map in under 2 minutes.

**Live:** [ismailsunni.id/petakarta](https://ismailsunni.id/petakarta)

## Features

- Upload any CSV with province-level data
- Automatic province matching by name (with fuzzy matching and aliases) or ISO code
- 8 color ramps (sequential and diverging) powered by chroma.js
- 3 classification methods: Quantile, Equal Interval, Natural Breaks (Jenks)
- Interactive legend with 4-position snapping
- Hover tooltips showing province name and value
- High-res PNG export with legend and title compositing
- Sample datasets included (GDP per Capita, HDI, Population Density)

## Tech Stack

React 18, Vite 5, Tailwind CSS 3, OpenLayers 9, Zustand 4, chroma.js, simple-statistics, PapaParse, html2canvas

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build       # Production build
npm run deploy      # Build + deploy to GitHub Pages
```

## Data Source

Province boundaries from [GADM 4.1](https://gadm.org/) (level 1, simplified to 5%).

## License

ISC
