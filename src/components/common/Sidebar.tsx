import { NavLink } from 'react-router-dom'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Library', to: '/library' },
  { label: 'Recommend', to: '/recommendations' },
  { label: 'Explore', to: '/explore' },
  { label: 'Wild Card', to: '/wildcard' },
  { label: 'Profile', to: '/profile' },
]

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0 z-40 w-56
        bg-[#111220] border-r border-[#1e2035]
        flex flex-col py-4
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ label, to }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3 py-2 rounded text-sm text-[#f72585] bg-[#f7258510] [text-shadow:0_0_8px_#f72585] active:scale-[0.97] transition-[colors,transform] duration-150'
                : 'flex items-center gap-3 px-3 py-2 rounded text-sm text-[#8891a8] hover:text-[#e8e4dc] hover:bg-[#181a2e] active:scale-[0.97] transition-[colors,transform] duration-150'
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
