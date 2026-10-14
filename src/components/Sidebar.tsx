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
          style={{ zIndex: 55 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">
              <TrendingUp size={20} color="#fff" />
            </div>
            <div>
              <div className="sidebar-logo-text">TradeLog</div>
              <div className="sidebar-logo-sub">Trading Journal</div>
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
        <nav className="sidebar-nav">
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
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 11,
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
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
        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{ color: 'var(--loss)' }}
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
