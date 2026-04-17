import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';
import { keycloakLogout } from '../../services/authService';

export default function Layout() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    keycloakLogout();
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#e8e4dc] font-mono">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0b14]/90 backdrop-blur-sm border-b border-[#1e2035] flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex flex-col gap-1.5 p-1 text-[#8891a8] hover:text-[#e8e4dc] transition-colors"
            aria-label="Open menu"
          >
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
          </button>

          <span className="text-base md:text-lg font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </span>
        </div>

        {/* Search — hidden on small screens */}
        <input
          placeholder="Search games..."
          className="hidden sm:block bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none w-48 md:w-64 transition-colors"
        />

        <button
          onClick={handleLogout}
          className="text-xs text-[#4a5068] hover:text-[#8891a8] transition-colors"
        >
          Sign out
        </button>
      </nav>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Body */}
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-0 md:ml-56 pt-16 px-4 pb-4 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
