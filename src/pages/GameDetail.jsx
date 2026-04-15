import { useParams } from 'react-router-dom';

export default function GameDetail() {
  const { rawgId } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#e8e4dc]">Game Detail</h1>
        <span className="text-xs text-[#4a5068]">rawgId: {rawgId}</span>
      </div>
      <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[#111220] border border-[#1e2035] rounded-lg">
        <p className="text-[#f72585] text-sm [text-shadow:0_0_8px_#f72585]">[ LOADING... ]</p>
        <p className="text-xs text-[#4a5068]">Game detail view — coming in week 7</p>
      </div>
    </div>
  );
}
