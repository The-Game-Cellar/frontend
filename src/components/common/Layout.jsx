import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AttributionFooter from './AttributionFooter';
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
          {/* Hamburger — mobile only. Toggles open/close on the same button so the user
              never has to dig for the close affordance. The three bars morph to an × when
              open: top bar rotates 45°, bottom bar rotates -45°, middle bar fades. The bars
              live in a fixed-height column so the morph happens in place rather than nudging
              the navbar layout. */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="md:hidden relative w-5 h-5 p-1 text-[#8891a8] hover:text-[#e8e4dc] transition-colors"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <span
              className={`absolute left-1 right-1 h-px bg-current transition-transform duration-200 ${
                sidebarOpen ? 'top-1/2 rotate-45' : 'top-[6px]'
              }`}
            />
            <span
              className={`absolute left-1 right-1 top-1/2 h-px bg-current transition-opacity duration-200 ${
                sidebarOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-1 right-1 h-px bg-current transition-transform duration-200 ${
                sidebarOpen ? 'top-1/2 -rotate-45' : 'top-[14px]'
              }`}
            />
          </button>

          <span className="text-base md:text-lg font-semibold text-[#e8e4dc] tracking-wider">
            THE GAME CELLAR
          </span>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          className="text-xs text-[#8891a8] border border-[#4a5068] rounded px-3 py-1 hover:border-[#f72585] hover:text-[#f72585] hover:[box-shadow:0_0_12px_#f72585,0_0_24px_#f7258540] transition-[border-color,box-shadow,color] duration-200"
        >
          Sign out
        </button>
      </nav>

      {/* Mobile backdrop — always mounted, fades via opacity so it animates in sync with the
          sidebar's translate-x transition. pointer-events toggle keeps the layer click-through
          when hidden. */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
        className={`fixed inset-0 z-30 bg-black/60 md:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Body */}
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 ml-0 md:ml-56 pt-24 px-4 pb-4 md:px-8 md:pb-6 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <AttributionFooter />
        </main>
      </div>

      {/* Logout confirm modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-enter"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-[#111220] border border-[#1e2035] rounded-lg p-6 w-full max-w-xs space-y-4 animate-enter"
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
                className="px-4 py-1.5 bg-[#ef444410] border border-[#ef4444] text-[#ef4444] text-xs rounded [box-shadow:0_0_8px_#ef444440,0_0_20px_#ef444420] hover:bg-[#ef444420] hover:[box-shadow:0_0_12px_#ef444450,0_0_25px_#ef444430] transition-[background-color,box-shadow] duration-200"
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
