import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[52px] sm:h-[60px] bg-white border-b border-[#eae7e1] px-3 sm:px-6 flex items-center justify-between font-sans">
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[#1a1a1a] font-serif text-base sm:text-xl tracking-wide">Q-Sentinel</span>
          <span className="text-[#9a9590] text-sm">⚕</span>
        </div>
        <span className="text-[#9a9590] text-[9px] sm:text-[10px] uppercase tracking-wider hidden sm:block">Quantum TB Diagnostics</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#eae7e1] flex items-center justify-center text-[#1a1a1a] font-medium text-xs sm:text-sm shrink-0">
            {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'DR'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[#1a1a1a] font-medium text-sm">{user?.name || 'Dr. Sarah Chen'}</span>
            <span className="text-[#9a9590] text-xs">{user?.department || 'Pulmonology'}</span>
          </div>
        </div>
        <div className="w-px h-5 sm:h-6 bg-[#d4d0ca]" />
        <button
          onClick={logout}
          className="text-[#9a9590] hover:text-[#c2484a] text-sm font-medium transition-colors flex items-center gap-1"
          title="Sign Out"
        >
          <LogOut size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Sign Out</span>
          <LogOut size={14} className="hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
