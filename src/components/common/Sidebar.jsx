import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Library', to: '/library' },
  { label: 'Recommend', to: '/recommendations' },
  { label: 'Explore', to: '/explore' },
  { label: 'Wild Card', to: '/wildcard' },
  { label: 'Profile', to: '/profile' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[#111220] border-r border-[#1e2035] flex flex-col py-4">
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3 py-2 rounded text-sm text-[#f72585] bg-[#f7258510] [text-shadow:0_0_8px_#f72585] transition-colors'
                : 'flex items-center gap-3 px-3 py-2 rounded text-sm text-[#8891a8] hover:text-[#e8e4dc] hover:bg-[#181a2e] transition-colors'
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
