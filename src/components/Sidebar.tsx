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

  const currentNavLabel = NAV_ITEMS.find((item) => item.id === activeNav)?.label || 'Dashboard';

  return (
    <>
      {/* Mobile Sticky Top Header Bar */}
      <div className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-icon btn-ghost"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg)' }}>
              {currentNavLabel}
            </span>
          </div>
        </div>

        <button
          className="btn-icon btn-ghost"
          onClick={() => setActiveNav('new-trade')}
          aria-label="New Trade"
          title="Log New Trade"
        >
          <PlusCircle size={22} style={{ color: 'var(--accent)' }} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="overlay"
          style={{ zIndex: 55, backdropFilter: 'blur(10px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Glass Sidebar Drawer */}
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

          {/* Mobile close button */}
          <button
            className="btn-icon btn-ghost"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
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
                <span>{item.label}</span>
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

        {/* Footer actions: Theme Toggle & Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            className="sidebar-link"
            onClick={handleLogout}
            style={{ color: 'var(--loss)' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
