import { useState } from 'react';

export default function RatingWidget({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(null);

  const display = hovered !== null ? hovered : value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(null)}
          className={`w-5 h-5 rounded-sm border transition-all duration-100 ${
            display >= n
              ? 'bg-[#f7258530] border-[#f72585] [box-shadow:0_0_4px_#f7258580]'
              : 'bg-[#1e2035] border-[#2a2d45]'
          } ${readonly ? 'cursor-default' : 'cursor-pointer hover:border-[#f72585]'}`}
        />
      ))}
      {value != null && (
        <span className="ml-2 text-xs text-[#8891a8]">
          <span className="text-[#f72585] [text-shadow:0_0_6px_#f72585]">{value}</span>
          /10
        </span>
      )}
    </div>
  );
}
