import Header from './components/Header'
import Footer from './components/Footer'
import MapView from './components/Map/MapView'
import Sidebar from './components/Sidebar/Sidebar'

export default function App() {
  return (
    <div className="flex flex-col h-full font-sans bg-canvas text-ink">
      <Header />
      <main className="flex flex-1 min-h-0">
        <Sidebar />
        <MapView />
      </main>
      <Footer />
    </div>
  )
}
