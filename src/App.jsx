import Header from './components/Header'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="flex flex-col h-full font-sans bg-canvas text-ink">
      <Header />
      <main className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <p className="p-8 text-muted">Map will go here</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
