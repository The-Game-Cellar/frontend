import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
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
          className="hidden sm:block bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-sm text-[#e8e4dc] placeholder:text-[#8891a8] focus:border-[#f72585] focus:outline-none w-48 md:w-64 transition-colors"
        />

        <button
          onClick={() => setConfirmOpen(true)}
          className="text-xs text-[#8891a8] hover:text-[#e8e4dc] transition-colors"
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
        <main className="flex-1 min-w-0 ml-0 md:ml-56 pt-24 px-4 pb-8 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Logout confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#e8e4dc]">Sign out?</p>
              <p className="text-xs text-[#4a5068]">You will be returned to the login page.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-1.5 border border-[#2a2d45] text-[#8891a8] text-xs rounded hover:border-[#8891a8] hover:text-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
