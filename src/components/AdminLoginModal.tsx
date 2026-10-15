import React, { useState } from 'react';
import { X, KeyRound, AlertCircle, Eye, EyeOff, ArrowRight, Store, Sparkles, Heart } from 'lucide-react';
import { api } from '../api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('admin@mochisteps.com');
  const [password, setPassword] = useState('mochi123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Email atau kata sandi pengelola salah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@mochisteps.com');
    setPassword('mochi123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MochiSteps Brand Header */}
        <div className="relative px-6 pt-7 pb-6 bg-gradient-to-br from-[#2D2A26] via-[#24211D] to-[#1A1816] text-white">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              {/* Pink Heart Logo Badge */}
              <div className="w-12 h-12 rounded-2xl bg-[#FDE8E9]/15 border border-[#FDE8E9]/30 flex items-center justify-center shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#B36B73]/20 blur-xs"></div>
                <Heart className="w-6 h-6 text-[#F6A5B2] fill-[#F6A5B2] relative z-10 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-brand font-black text-xl tracking-wider text-[#FAF8F5]">
                    MOCHI STEPS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B36B73]/30 text-[#F6C2C9] border border-[#B36B73]/40 tracking-wider uppercase">
                    Official
                  </span>
                </div>
                <p className="text-xs text-[#D9D3CC] mt-0.5 font-medium">
                  Portal Khusus Manajemen & Logistik Toko Resmi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Tutup & Kembali ke Toko"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-brand font-bold text-base text-[#2D2A26]">
              Masuk ke Panel Pengelola
            </h3>
            <p className="text-xs text-[#7A6E60] mt-0.5">
              Kelola pesanan, verifikasi pembayaran, POS kasir, dan persediaan stok toko.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#453D34] block mb-1.5">
                Email / Username Petugas
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mochisteps.com"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] focus:ring-1 focus:ring-[#B36B73] font-medium text-[#2D2A26] transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#453D34] block mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] focus:ring-1 focus:ring-[#B36B73] font-mono font-medium text-[#2D2A26] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7D6B] hover:text-[#2D2A26] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#B36B73] rounded border-[#DDD3C7]"
                />
                <span className="text-xs text-[#5F5549] font-medium">Ingat sesi login saya</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] text-[#B36B73] hover:text-[#8F4850] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Otomatis</span>
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#2D2A26] hover:bg-[#1A1816] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi kredensial...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-[#E3B890]" />
                  <span>Masuk ke Panel Pengelola Toko</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back to Storefront Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-[#F3ECE0] text-[#5A4E40] border border-[#E5DACD] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-[#B36B73]" />
                <span>Kembali ke Toko Online (Belanja)</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
