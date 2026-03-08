export default function Footer() {
  const base = import.meta.env.BASE_URL
  return (
    <footer className="bg-ink text-paper/50 text-xs flex flex-wrap items-center justify-between gap-2 px-5 py-2 shrink-0 overflow-x-hidden">
      <span>Data: BPS Indonesia, laravel-nusa &middot; Built with OpenLayers &middot; &copy; 2026</span>
      <div className="flex gap-4">
        <a href={`${base}?page=about`} className="hover:text-paper transition-colors">About</a>
        <a href={`${base}?page=about#guide`} className="hover:text-paper transition-colors">Guide</a>
        <a href={`${base}?page=about#privacy`} className="hover:text-paper transition-colors">Privacy</a>
        <a href="https://github.com/ismailsunni/petakarta" target="_blank" rel="noopener noreferrer" className="hover:text-paper transition-colors">GitHub</a>
      </div>
    </footer>
  )
}
