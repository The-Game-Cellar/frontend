import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AttributionFooter from './AttributionFooter'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#e8e4dc] font-mono">
      <TopBar menuOpen={sidebarOpen} onToggleMenu={() => setSidebarOpen((o) => !o)} />

      {/* Mobile backdrop, always mounted, fades via opacity so it animates in sync with the
          sidebar's translate-x transition. pointer-events toggle keeps the layer click-through
          when hidden. */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
        className={`fixed inset-0 z-30 bg-black/60 md:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 ml-0 md:ml-56 pt-24 px-4 pb-4 md:px-8 md:pb-6 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <AttributionFooter />
        </main>
      </div>
    </div>
  )
}
