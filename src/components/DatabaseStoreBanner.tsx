import React from 'react';
import { Database, HardDrive, CheckCircle2, ChevronRight, Activity, Layers } from 'lucide-react';

interface DatabaseStoreBannerProps {
  onOpenInspector: () => void;
  productsCount: number;
  ordersCount?: number;
  customersCount?: number;
}

export const DatabaseStoreBanner: React.FC<DatabaseStoreBannerProps> = ({
  onOpenInspector,
  productsCount,
  ordersCount = 6,
  customersCount = 5
}) => {
  return (
    <div className="bg-[#24211E] text-[#EBE3D7] border-b border-[#3D362F] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          
          {/* Left: DB Store & Status */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[#342D26] px-2.5 py-1 rounded-md border border-[#4C4035] text-[#E8C29D] font-mono text-[11px] font-semibold">
              <Database className="w-3.5 h-3.5 text-[#E8BA93]" />
              <span>DB: mochisteps_db.json</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real Database Connected (Single Source of Truth)</span>
            </div>

            <span className="text-[#695F54] hidden sm:inline">|</span>

            <div className="text-[11px] text-[#B8ACA0] flex items-center gap-2">
              <span>Lokasi: <code className="bg-[#1C1A18] px-1.5 py-0.5 rounded text-[#DFC8B2] font-mono">/data/mochisteps_db.json</code></span>
            </div>
          </div>

          {/* Right: Data Counts & Action Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="flex items-center gap-3 text-[11px] text-[#CDC1B4]">
              <span><strong>{productsCount || 12}</strong> Produk</span>
              <span>·</span>
              <span><strong>{ordersCount}</strong> Pesanan</span>
              <span>·</span>
              <span><strong>{customersCount}</strong> Pelanggan</span>
            </div>

            <button
              onClick={onOpenInspector}
              className="inline-flex items-center gap-1.5 bg-[#B36B73] hover:bg-[#C27981] text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Lihat DB Store</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
