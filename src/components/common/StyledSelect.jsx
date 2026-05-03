import { useState, useEffect, useRef } from 'react';

export default function StyledSelect({
  value,
  onChange,
  options,
  disabled = false,
  alwaysActive = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = e => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);
  const triggerLabel = selected ? selected.label : (options[0]?.label ?? '');
  const defaultValue = options[0]?.value ?? '';
  const isActive = alwaysActive || (value !== '' && value != null && value !== defaultValue);

  const select = (next) => {
    onChange(next);
    setOpen(false);
  };

  const triggerColor = isActive
    ? 'border-[#f72585] text-[#f72585]'
    : 'border-[#2a2d45] text-[#8891a8] hover:border-[#8891a8] hover:text-[#e8e4dc]';

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`bg-[#111220] border rounded pl-3 pr-3 py-1.5 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-full text-left ${triggerColor}`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="ml-auto text-[10px] opacity-60">▾</span>
      </button>

      {open && !disabled && (
        <div
          style={{ width: 'max-content', maxWidth: '20rem' }}
          className="styled-scrollbar absolute z-40 top-full left-0 mt-1 max-h-72 overflow-y-auto bg-[#111220] border border-[#2a2d45] rounded shadow-[0_4px_12px_rgba(0,0,0,0.6)] py-1 text-xs"
        >
          {options.map(opt => (
            <button
              type="button"
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`block w-full text-left px-4 py-1.5 transition-colors whitespace-nowrap ${
                opt.value === value
                  ? 'text-[#f72585] [text-shadow:0_0_6px_#f72585]'
                  : 'text-[#e8e4dc] hover:bg-[#181a2e]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
