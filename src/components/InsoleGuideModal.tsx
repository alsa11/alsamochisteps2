import React from 'react';
import { X, Ruler, CheckCircle2, Footprints, Info } from 'lucide-react';

interface InsoleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsoleGuideModal: React.FC<InsoleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sizeTable = [
    { size: 36, insoleLength: '23.0 cm', recommendedFoot: '22.0 - 22.5 cm' },
    { size: 37, insoleLength: '23.5 cm', recommendedFoot: '22.6 - 23.0 cm' },
    { size: 38, insoleLength: '24.0 cm', recommendedFoot: '23.1 - 23.5 cm' },
    { size: 39, insoleLength: '24.5 cm', recommendedFoot: '23.6 - 24.0 cm' },
    { size: 40, insoleLength: '25.0 cm', recommendedFoot: '24.1 - 24.5 cm' },
    { size: 41, insoleLength: '25.5 cm', recommendedFoot: '24.6 - 25.0 cm' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#EAE3DA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FCEAE9] text-[#B36B73] flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-brand font-bold text-base text-[#24211D]">
                Panduan Ukuran Insole Sepatu
              </h2>
              <p className="text-[11px] text-[#7F7466]">
                Teknologi Cloud-Cushion 8mm mochi steps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#EFE7DE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-[#52493F]">
          
          {/* Size Chart Table */}
          <div>
            <h3 className="font-bold text-[#2D2A26] mb-2 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-[#B36B73]" />
              Tabel Ukuran Insole (Panjang Dalam Sepatu)
            </h3>
            <div className="rounded-xl border border-[#EAE2D7] overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-[#FAF7F2] border-b border-[#EAE2D7] text-[#695F52] text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Size (EUR)</th>
                    <th className="py-2.5 px-3 font-semibold text-[#B36B73]">Panjang Insole</th>
                    <th className="py-2.5 px-3">Panjang Kaki Disarankan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE6]">
                  {sizeTable.map((row) => (
                    <tr key={row.size} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 px-3 font-bold text-[#2D2A26] tabular-nums">{row.size}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#2D2A26] tabular-nums">{row.insoleLength}</td>
                      <td className="py-2.5 px-3 text-[#6B6154] tabular-nums">{row.recommendedFoot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3 Langkah Mudah Mengukur Kaki */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DEC0]/60 space-y-2.5">
            <h4 className="font-bold text-[#2D2A26]">Cara Mudah Mengukur Kaki di Rumah:</h4>
            <ol className="space-y-2 pl-4 list-decimal text-[11px] leading-relaxed">
              <li>
                <strong>Letakkan Kertas:</strong> Taruh selembar kertas HVS di lantai yang rata merapat ke dinding.
              </li>
              <li>
                <strong>Berdiri Tegak:</strong> Berdiri di atas kertas dengan tumit menempel rapat ke dinding.
              </li>
              <li>
                <strong>Beri Garis:</strong> Tandai ujung jari kaki yang paling panjang menggunakan pensil, lalu ukur jarak dinding ke garis dengan penggaris.
              </li>
            </ol>
          </div>

          {/* Tips Kaki Lebar & Garansi */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-[#735124]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Tips Pemilihan Ukuran (Upsize):</strong> Jika Anda memiliki punggung kaki tebal atau telapak kaki yang lebar, kami sangat menyarankan <strong>naik 1 ukuran (upsize)</strong> untuk kenyamanan maksimal.
            </div>
          </div>

          {/* Garansi Tukar Size */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-[11px] text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Garansi penukaran ukuran 7 hari jika sepatu kekecilan atau kebesaran!</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2D2A26] text-white rounded-xl font-semibold hover:bg-[#433E37] transition-colors"
          >
            Mengerti & Lanjut Belanja
          </button>

        </div>
      </div>
    </div>
  );
};
