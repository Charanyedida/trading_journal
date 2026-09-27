'use client';

import { useState } from 'react';
import { useTradingStore } from '@/store';
import { useTheme } from '@/components/ThemeProvider';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  CheckSquare,
  BarChart3,
  Calendar,
  Settings,
  BookOpen,
  Sun,
  Moon,
  Menu,
  X,
  TrendingUp,
  Target,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-trade', label: 'New Trade', icon: PlusCircle },
  { id: 'trade-log', label: 'Trade Log', icon: List },
  { id: 'checklist', label: 'Daily Checklist', icon: CheckSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'strategies', label: 'Strategies', icon: Target },
  { id: 'journal', label: 'Daily Journal', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { activeNav, setActiveNav } = useTradingStore();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="btn-icon btn-ghost"
        onClick={() => setMobileOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
          display: 'none',
        }}
        id="mobile-menu-btn"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="overlay"
          style={{ zIndex: 45 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <TrendingUp size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg)', lineHeight: 1.2 }}>
                TradeLog
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 500 }}>
                Trading Journal
              </div>
            </div>
          </div>
          {/* Mobile close */}
          <button
            className="btn-icon btn-ghost"
            onClick={() => setMobileOpen(false)}
            style={{ display: 'none' }}
            id="mobile-close-btn"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                {item.label}
                {item.id === 'new-trade' && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: 'var(--accent)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    +
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section: theme toggle and logout */}
        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)' }}>
          <button
            className="sidebar-link"
            onClick={toggleTheme}
            style={{ width: '100%', marginBottom: 8 }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{ width: '100%', color: 'var(--red)' }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 768px) {
          #mobile-menu-btn {
            display: flex !important;
          }
          #mobile-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
