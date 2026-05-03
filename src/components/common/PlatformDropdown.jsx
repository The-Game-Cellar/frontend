import { useState, useEffect, useRef } from 'react';

/**
 * Hierarchical platform picker for the Explore page. The backend
 * `/api/v1/games/platforms` endpoint returns Big-4 umbrellas (PlayStation, PC,
 * Nintendo, Xbox) plus an alphabetical "others" tail. Picking an umbrella label
 * fires {@code onChange} with all of its child platform names joined by ","; the
 * search spec OR-matches the IN-clause server-side. Picking a child fires
 * {@code onChange} with that child's name only.
 *
 * Umbrella children expand as a sideways flyout on hover (right of the main
 * panel). The flyout is rendered with {@code position: fixed} so it can escape
 * the main panel's vertical scroll area — `overflow-y` clips both axes, so an
 * absolutely-positioned flyout inside the panel would get cut off horizontally.
 *
 * Props:
 *   value     — currently selected filter (single platform name, comma-list, or "")
 *   groups    — Big-4 array from `/platforms` (PlayStation/PC/Nintendo/Xbox, in pin order)
 *   others    — alphabetical tail from `/platforms`
 *   onChange  — fired with the new filter string (or "" for All Platforms)
 */
export default function PlatformDropdown({ value, groups, others, onChange }) {
  const [open, setOpen] = useState(false);
  const [hoveredUmbrella, setHoveredUmbrella] = useState(null);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setHoveredUmbrella(null);
      }
    };
    const handleKey = e => {
      if (e.key === 'Escape') {
        setOpen(false);
        setHoveredUmbrella(null);
      }
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  const triggerLabel = resolveTriggerLabel(value, groups, others);

  const select = (next) => {
    onChange(next);
    setOpen(false);
    setHoveredUmbrella(null);
  };

  const scheduleClose = () => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredUmbrella(null), 120);
  };

  const cancelClose = () => clearTimeout(hoverTimerRef.current);

  const showFlyout = (label, rowEl) => {
    cancelClose();
    setHoveredUmbrella(label);
    if (rowEl) {
      const rect = rowEl.getBoundingClientRect();
      setFlyoutPos({ top: rect.top, left: rect.right + 4 });
    }
  };

  const isPicked = (candidate) => candidate === value;

  const activeGroup = hoveredUmbrella
    ? groups.find(g => g.label === hoveredUmbrella)
    : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`bg-[#111220] border rounded px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
          value
            ? 'border-[#f72585] text-[#f72585]'
            : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]'
        }`}
      >
        <span>{triggerLabel}</span>
        <span className="text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div
          style={{ width: 'max-content', maxWidth: '20rem' }}
          className="styled-scrollbar absolute z-40 top-full left-0 mt-1 max-h-80 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1"
        >
          <button
            type="button"
            onClick={() => select('')}
            onMouseEnter={scheduleClose}
            className={`block w-full text-left px-4 py-1.5 text-xs whitespace-nowrap transition-colors ${
              value === ''
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            }`}
          >
            All
          </button>

          {groups.map(group => {
            const childrenJoined = group.platforms.join(',');
            const umbrellaPicked = group.umbrella && isPicked(childrenJoined);
            const isFlyoutOpen = hoveredUmbrella === group.label;
            const showCaret = group.umbrella && group.platforms.length > 1;
            const baseClass = 'w-full flex items-center justify-between gap-3 px-4 py-1.5 text-xs whitespace-nowrap transition-colors';
            const activeColorClass =
              (group.umbrella && umbrellaPicked) ||
              (!group.umbrella && isPicked(group.platforms[0]))
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : isFlyoutOpen
                  ? 'bg-[#181a2e] text-[#e8e4dc]'
                  : 'text-[#e8e4dc] hover:bg-[#181a2e]';

            return (
              <button
                type="button"
                key={group.label}
                onClick={() =>
                  group.umbrella ? select(childrenJoined) : select(group.platforms[0])
                }
                onMouseEnter={(e) =>
                  group.umbrella ? showFlyout(group.label, e.currentTarget) : scheduleClose()
                }
                className={`${baseClass} ${activeColorClass}`}
              >
                <span>{group.label}</span>
                {showCaret && <span className="text-[10px] opacity-60">▸</span>}
              </button>
            );
          })}

          {others.length > 0 && (
            <>
              <div className="my-1 border-t border-[#1e2035]" />
              {others.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => select(name)}
                  onMouseEnter={scheduleClose}
                  className={`block w-full text-left px-4 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    isPicked(name)
                      ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                      : 'text-[#e8e4dc] hover:bg-[#181a2e]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {open && activeGroup && activeGroup.umbrella && (
        <div
          className="styled-scrollbar fixed z-50 max-h-80 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1"
          style={{ top: flyoutPos.top, left: flyoutPos.left, width: 'max-content', maxWidth: '20rem' }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            onClick={() => select(activeGroup.platforms.join(','))}
            className={`block w-full text-left px-4 py-1.5 text-xs whitespace-nowrap transition-colors ${
              isPicked(activeGroup.platforms.join(','))
                ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                : 'text-[#e8e4dc] hover:bg-[#181a2e]'
            }`}
          >
            All {activeGroup.label}
          </button>
          <div className="my-1 border-t border-[#1e2035]" />
          {activeGroup.platforms.map(child => (
            <button
              key={child}
              type="button"
              onClick={() => select(child)}
              className={`block w-full text-left px-4 py-1.5 text-xs whitespace-nowrap transition-colors ${
                isPicked(child)
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : 'text-[#8891a8] hover:bg-[#181a2e] hover:text-[#e8e4dc]'
              }`}
            >
              {child}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function resolveTriggerLabel(value, groups, others) {
  if (!value) return 'All';
  if (value.includes(',')) {
    const match = groups.find(g => g.umbrella && g.platforms.join(',') === value);
    if (match) return match.label;
  }
  for (const g of groups) {
    if (g.platforms.includes(value)) return value;
  }
  if (others.includes(value)) return value;
  return value;
}
