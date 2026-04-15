import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import useAuth from '../../hooks/useAuth';
import { keycloakLogout } from '../../services/authService';

export default function Layout() {
  const { logout } = useAuth();

  function handleLogout() {
    logout();          // clear local token
    keycloakLogout();  // invalidate session in Keycloak
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-[#e8e4dc] font-mono">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0a0b14]/90 backdrop-blur-sm border-b border-[#1e2035] flex items-center justify-between px-6">
        <span className="text-lg font-semibold text-[#e8e4dc] tracking-wider">
          THE GAME CELLAR
        </span>

        <input
          placeholder="Search games..."
          className="bg-[#111220] border border-[#1e2035] rounded px-3 py-1.5 text-sm text-[#e8e4dc] placeholder:text-[#4a5068] focus:border-[#f72585] focus:outline-none w-64 transition-colors"
        />

        <button
          onClick={handleLogout}
          className="text-xs text-[#4a5068] hover:text-[#8891a8] transition-colors"
        >
          Sign out
        </button>
      </nav>

      {/* Body */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-56 pt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
