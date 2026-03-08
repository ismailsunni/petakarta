const NAV = [
  { id: 'about',    label: 'About' },
  { id: 'guide',    label: 'How to Use' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'changelog',label: 'Changelog' },
  { id: 'privacy',  label: 'Privacy Policy' },
  { id: 'credits',  label: 'Credits' },
]

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-14 scroll-mt-8">
      <h2 className="font-display text-2xl mb-5 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-ink/90">
        {children}
      </div>
    </section>
  )
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-ink text-paper text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div>
        <p className="font-medium text-ink mb-1">{title}</p>
        <p className="text-ink/80">{children}</p>
      </div>
    </div>
  )
}

function Q({ q, children }) {
  return (
    <div>
      <p className="font-medium text-ink mb-1">{q}</p>
      <p className="text-ink/80">{children}</p>
    </div>
  )
}

function ChangeEntry({ version, date, items }) {
  return (
    <div>
      <p className="font-medium text-ink">
        {version} <span className="font-normal text-muted">— {date}</span>
      </p>
      <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-ink/80">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

export default function AboutPage() {
  const base = import.meta.env.BASE_URL

  return (
    <div className="min-h-full bg-canvas text-ink font-sans">
      {/* Header */}
      <header className="h-[52px] bg-ink text-paper flex items-center justify-between px-5 shrink-0 border-b border-ink/20 sticky top-0 z-30">
        <a href={base} className="font-display text-xl tracking-tight hover:opacity-80 transition-opacity">
          PetaKarta
        </a>
        <div className="flex items-center gap-4 text-sm">
          <a href={`${base}?page=gallery`} className="text-paper/80 hover:text-paper transition-colors">Gallery</a>
          <a href={base} className="text-paper/80 hover:text-paper transition-colors">Open Editor</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-12">

        {/* Sidebar nav — desktop only */}
        <aside className="hidden lg:block w-44 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm text-muted hover:text-ink transition-colors py-0.5"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* Page title */}
          <h1 className="font-display text-4xl mb-10">About PetaKarta</h1>

          {/* ── About ─────────────────────────────────────── */}
          <Section id="about" title="About">
            <p>
              <strong>PetaKarta</strong> is a free, browser-based tool for making choropleth maps
              of Indonesian administrative areas — provinces and regencies. Upload a CSV file (or
              type values directly), pick a color scheme, and export a publication-ready PNG.
              No GIS software, no account required.
            </p>
            <p>
              Everything runs in your browser. Your data never leaves your device unless you
              explicitly choose to save a project to your account.
            </p>
            <p>
              PetaKarta is open source.{' '}
              <a
                href="https://github.com/ismailsunni/petakarta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                View the source code on GitHub
              </a>
              {' '}— contributions and bug reports are welcome.
            </p>
            <div className="rounded border border-border bg-paper px-4 py-3">
              <p className="font-medium mb-1">How to cite PetaKarta</p>
              <p className="text-muted font-mono text-xs">
                Ismail Sunni. PetaKarta (2026). Free choropleth map tool for Indonesian data.
                https://ismailsunni.id/petakarta
              </p>
            </div>
          </Section>

          {/* ── How to Use ────────────────────────────────── */}
          <Section id="guide" title="How to Use">
            <p>Making a map takes about two minutes. Here's how:</p>

            <div className="space-y-5 mt-2">
              <Step n="1" title="Choose an admin layer">
                Click the <strong>Admin Layer</strong> dropdown in the Data tab. Choose
                <em> Indonesia – Provinces</em> for a national overview, or type a province name
                to filter and select its regencies (e.g. "Jawa Barat").
              </Step>

              <Step n="2" title="Prepare your data">
                Your CSV needs at least two columns: one that identifies the area (by name or
                numeric code) and one with your values. Click <em>Download template CSV</em> to
                get a pre-filled file with the correct codes and names for your chosen layer.
              </Step>

              <Step n="3" title="Load data">
                Drag and drop your CSV onto the upload area, or click to browse. Alternatively,
                switch to <em>Enter manually</em> to type values directly into a table — no file
                needed. Sample datasets are also available in the dropdown below the upload area.
              </Step>

              <Step n="4" title="Map columns">
                Select which column contains the area identifier (<em>Area Key Column</em>) and
                which contains the value to display (<em>Value Column</em>). Set <em>Key Type</em>{' '}
                to <em>ID</em> if your column uses numeric codes (e.g. <code>34.01</code>), or
                <em> Name</em> for province/regency names. Click <strong>Apply</strong>.
              </Step>

              <Step n="5" title="Style your map">
                Go to the <strong>Style</strong> tab. Choose a color ramp, classification method
                (Quantile, Natural Breaks, Equal Interval), and the number of classes. For
                categorical data (e.g. island group), switch to <em>Categorized</em> mode.
              </Step>

              <Step n="6" title="Export or save">
                In the <strong>Export</strong> tab, click <em>Export PNG</em> to download the
                map. To save and share, sign in with Google — saved projects can be made public
                and shared via a link.
              </Step>
            </div>
          </Section>

          {/* ── FAQ ───────────────────────────────────────── */}
          <Section id="faq" title="FAQ">
            <div className="space-y-5">
              <Q q="Does my data get uploaded to a server?">
                No. CSV parsing and map rendering happen entirely in your browser. Your data only
                reaches a server if you explicitly sign in and save a project.
              </Q>

              <Q q="Which file formats are supported?">
                CSV only in v1. XLSX and other formats are not supported. If your data is in Excel,
                use <em>File → Save As → CSV</em> before uploading.
              </Q>

              <Q q="Why isn't my area name matching?">
                Name matching is fuzzy but not perfect — it normalises case and punctuation, and
                recognises common abbreviations (e.g. "DKI", "DIY", "Sulteng"). For reliable
                matching, use the numeric <em>kode</em> column instead of names. Download the
                template CSV to see the exact codes for your chosen layer.
              </Q>

              <Q q="Can I map regency-level data?">
                Yes. In the <strong>Admin Layer</strong> picker, search for your province and
                select its regency layer (e.g. "Jawa Barat" under the Regencies group). Each
                province loads its own GeoJSON file.
              </Q>

              <Q q="Can I embed the map on my website?">
                Not yet, but it's planned. For now, share a link to the public view of a saved
                project.
              </Q>

              <Q q="The map looks different when I export it. Why?">
                Make sure you click <strong>Apply</strong> after selecting columns before
                exporting. If the basemap tiles haven't fully loaded, wait a moment and try again.
              </Q>

              <Q q="Is PetaKarta free?">
                Yes, completely free. There is no paid tier and no usage limit.
              </Q>
            </div>
          </Section>

          {/* ── Changelog ─────────────────────────────────── */}
          <Section id="changelog" title="Changelog">
            <div className="space-y-6">
              <ChangeEntry
                version="v1.1.0"
                date="March 2026"
                items={[
                  'Added regency-level maps for all 38 provinces',
                  'Searchable layer picker replaces two-dropdown UI',
                  'Manual data entry: type values directly without a CSV',
                  'Fit button now zooms to the active layer\'s extent',
                  'GitHub Actions CI: unit tests + build check on every push',
                  'About, guide, FAQ, changelog, and privacy pages (this page)',
                ]}
              />
              <ChangeEntry
                version="v1.0.0"
                date="Early 2026"
                items={[
                  'Province-level choropleth maps for all 38 Indonesian provinces',
                  'CSV upload with name and ID matching',
                  'Graduated and categorized color modes',
                  'Quantile, Natural Breaks, and Equal Interval classification',
                  'Manual class break editor',
                  'PNG export with legend compositing',
                  'Save and share projects (requires Google sign-in)',
                  'Public gallery of shared maps',
                  'Multiple basemap options (OSM, Satellite, None)',
                ]}
              />
            </div>
          </Section>

          {/* ── Privacy ───────────────────────────────────── */}
          <Section id="privacy" title="Privacy Policy">
            <p className="text-muted text-xs">Last updated: March 2026</p>

            <p>
              PetaKarta is designed to be privacy-respecting by default. Here is what we collect
              and why.
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">What we collect</p>
                <ul className="list-disc list-inside space-y-1 text-ink/80">
                  <li>
                    <strong>If you sign in with Google:</strong> your email address, display name,
                    and profile photo, provided by Google.
                  </li>
                  <li>
                    <strong>If you save a project:</strong> the map state (column mappings, style
                    settings, any CSV data you uploaded) is stored in our database.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">What we do not collect</p>
                <ul className="list-disc list-inside space-y-1 text-ink/80">
                  <li>CSV files you upload without saving — they stay in your browser only.</li>
                  <li>Analytics or tracking cookies of any kind.</li>
                  <li>Your IP address or browsing behaviour.</li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Who can see your data</p>
                <p className="text-ink/80">
                  Your saved projects are private by default. Only you can see them. If you mark a
                  project as <em>Public</em>, anyone with the link can view it.
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">Third-party services</p>
                <ul className="list-disc list-inside space-y-1 text-ink/80">
                  <li>
                    <strong>Supabase</strong> — database and authentication host. Your account data
                    and saved projects are stored on Supabase infrastructure.
                  </li>
                  <li>
                    <strong>Google</strong> — OAuth provider for sign-in. We receive only the
                    information Google makes available (email, name, photo).
                  </li>
                  <li>
                    <strong>OpenStreetMap tile servers</strong> — map background tiles are fetched
                    from OSM/CARTO tile CDNs when a basemap is enabled. Your IP may be logged by
                    those services under their own privacy policies.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium mb-1">Deleting your data</p>
                <p className="text-ink/80">
                  To delete your account and all associated projects, open an issue on{' '}
                  <a
                    href="https://github.com/ismailsunni/petakarta/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    GitHub
                  </a>{' '}
                  or contact us directly. We will process deletion within 30 days.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Credits ───────────────────────────────────── */}
          <Section id="credits" title="Credits & Acknowledgements">
            <p>
              PetaKarta is built on the shoulders of excellent open-source projects and open data.
            </p>

            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium w-1/3">Project</th>
                  <th className="text-left py-2 font-medium text-muted">Used for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {[
                  ['OpenLayers 9', 'Map rendering and vector layer management'],
                  ['React 18', 'UI framework'],
                  ['Tailwind CSS 3', 'Styling'],
                  ['Zustand 4', 'State management'],
                  ['chroma.js', 'Color ramps and scale generation'],
                  ['simple-statistics', 'Jenks natural breaks and quantile classification'],
                  ['PapaParse', 'CSV parsing in the browser'],
                  ['html2canvas', 'Legend image compositing for PNG export'],
                  ['Supabase', 'Authentication and project storage'],
                  ['Vite 5', 'Build tooling'],
                  ['gh-pages', 'Deployment to GitHub Pages'],
                ].map(([name, use]) => (
                  <tr key={name}>
                    <td className="py-2 pr-4 font-medium text-ink">{name}</td>
                    <td className="py-2 text-ink/80">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 space-y-2">
              <p className="font-medium">Boundary data</p>
              <p className="text-ink/80">
                Province and regency boundaries are sourced from{' '}
                <a
                  href="https://github.com/laravolt/nusa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  laravel-nusa
                </a>
                , which aggregates data from Badan Pusat Statistik (BPS) Indonesia. Province
                boundaries were previously sourced from{' '}
                <a
                  href="https://gadm.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  GADM 4.1
                </a>
                .
              </p>
            </div>
          </Section>

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-ink text-paper/60 text-xs py-5 px-5 mt-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 PetaKarta · Data: BPS Indonesia, laravel-nusa · Built with OpenLayers</span>
          <div className="flex gap-4">
            <a href={`${base}?page=about`} className="hover:text-paper transition-colors">About</a>
            <a href={`${base}?page=gallery`} className="hover:text-paper transition-colors">Gallery</a>
            <a href="https://github.com/ismailsunni/petakarta" target="_blank" rel="noopener noreferrer" className="hover:text-paper transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
