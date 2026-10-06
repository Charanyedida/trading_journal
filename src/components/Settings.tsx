'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingStore } from '@/store';
import { createClient } from '@/utils/supabase/client';
import { Settings as SettingsIcon, User, Tag, Download, Sun, Moon, Check, X, AlertTriangle, AlertCircle, Wallet, ArrowDownLeft, ArrowUpRight, Trash2, Plus } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { MARKET_LABELS, MarketType, MistakeTag, AdjustmentType } from '@/types';

export function Settings() {
  const { preferences, setPreferences, mistakeTags, addMistakeTag, deleteMistakeTag, toggleMarket, marketConfigs, trades, capitalAdjustments, addCapitalAdjustment, deleteCapitalAdjustment } = useTradingStore();
  const { theme, toggleTheme } = useTheme();
  
  const [name, setName] = useState(preferences.name);
  const [savedUser, setSavedUser] = useState(false);

  const [startingCapital, setStartingCapital] = useState(preferences.startingCapital?.toString() || '');
  const [riskPerTradePct, setRiskPerTradePct] = useState(preferences.riskPerTradePct?.toString() || '1.0');
  const [maxDailyRiskPct, setMaxDailyRiskPct] = useState(preferences.maxDailyRiskPct?.toString() || '3.0');
  const [savedCapital, setSavedCapital] = useState(false);

  const handleSaveCapital = () => {
    setPreferences({ startingCapital: startingCapital ? parseFloat(startingCapital) : undefined });
    setSavedCapital(true);
    setTimeout(() => setSavedCapital(false), 2000);
  };

  const handleSaveRisk = () => {
    setPreferences({
      riskPerTradePct: riskPerTradePct ? parseFloat(riskPerTradePct) : 1.0,
      maxDailyRiskPct: maxDailyRiskPct ? parseFloat(maxDailyRiskPct) : 3.0,
    });
  };

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#ef4444');

  const handleSaveUser = () => {
    setPreferences({ name });
    setSavedUser(true);
    setTimeout(() => setSavedUser(false), 2000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addMistakeTag(newTagName, newTagColor);
    setNewTagName('');
  };

  // Capital adjustment form state
  const [adjType, setAdjType] = useState<AdjustmentType>('withdrawal');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjPurpose, setAdjPurpose] = useState('');
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjSaved, setAdjSaved] = useState(false);

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(adjAmount);
    if (!amount || amount <= 0 || !adjPurpose.trim()) return;
    addCapitalAdjustment(adjType, amount, adjPurpose.trim(), adjDate);
    setAdjAmount('');
    setAdjPurpose('');
    setAdjSaved(true);
    setTimeout(() => setAdjSaved(false), 2000);
  };

  const handleExportCSV = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: dbTrades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !dbTrades || dbTrades.length === 0) {
      alert("No trades to export or failed to fetch.");
      return;
    }

    const headers = ['Date', 'Symbol', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 'Net P&L', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...dbTrades.map(t => [
        t.created_at,
        t.symbol,
        t.direction,
        t.entry_price,
        t.exit_price,
        t.quantity,
        t.net_pnl,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Settings
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
          Manage your account, preferences, and data.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* Profile & Display */}
        <div className="stat-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--accent)" />
            Profile & Display
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Your Name</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSaveUser}>
                {savedUser ? <Check size={16} /> : 'Save'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Theme</label>
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          <div>
            <label className="input-label">Active Markets</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {marketConfigs.map(m => (
                <label key={m.type} className="checkbox-container" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={m.enabled}
                    onChange={() => toggleMarket(m.type)}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{MARKET_LABELS[m.type]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Capital & Risk Settings */}
        <div className="stat-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} color="var(--accent)" />
            Capital & Risk Settings
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Starting Capital</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                className="input"
                type="number"
                value={startingCapital}
                onChange={(e) => setStartingCapital(e.target.value)}
                placeholder="e.g. 100000"
              />
              <button className="btn btn-primary" onClick={handleSaveCapital}>
                {savedCapital ? <Check size={16} /> : 'Save'}
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Risk Per Trade (%)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={riskPerTradePct}
              onChange={(e) => setRiskPerTradePct(e.target.value)}
              onBlur={handleSaveRisk}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Max Daily Risk (%)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={maxDailyRiskPct}
              onChange={(e) => setMaxDailyRiskPct(e.target.value)}
              onBlur={handleSaveRisk}
            />
          </div>
        </div>

        {/* Capital Management */}
        <div className="stat-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownLeft size={18} color="var(--accent)" />
            Capital Management
          </h2>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16, lineHeight: 1.5 }}>
            Track deposits into and withdrawals from your trading account. These adjustments update your capital tracking.
          </p>

          <form onSubmit={handleAddAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className={`btn ${adjType === 'deposit' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setAdjType('deposit')}
              >
                <ArrowUpRight size={16} />
                Deposit
              </button>
              <button
                type="button"
                className={`btn ${adjType === 'withdrawal' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setAdjType('withdrawal')}
              >
                <ArrowDownLeft size={16} />
                Withdrawal
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Amount</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="e.g. 50000"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Date</label>
                <input
                  className="input"
                  type="date"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Purpose / Notes</label>
              <input
                className="input"
                placeholder={adjType === 'withdrawal' ? 'e.g. Profit withdrawal, Personal use' : 'e.g. Additional capital, Salary credit'}
                value={adjPurpose}
                onChange={(e) => setAdjPurpose(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!adjAmount || parseFloat(adjAmount) <= 0 || !adjPurpose.trim()}
              style={{ width: '100%' }}
            >
              {adjSaved ? <Check size={16} /> : <Plus size={16} />}
              {adjSaved ? 'Saved!' : `Add ${adjType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
            </button>
          </form>

          {/* Transaction History */}
          {capitalAdjustments.length > 0 && (
            <div>
              <label className="input-label" style={{ marginBottom: 10 }}>Transaction History</label>
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...capitalAdjustments].reverse().map((adj) => (
                  <div
                    key={adj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: adj.type === 'deposit' ? 'var(--profit-bg, rgba(34,197,94,0.1))' : 'var(--loss-bg, rgba(239,68,68,0.1))',
                      flexShrink: 0,
                    }}>
                      {adj.type === 'deposit'
                        ? <ArrowUpRight size={16} style={{ color: 'var(--profit)' }} />
                        : <ArrowDownLeft size={16} style={{ color: 'var(--loss)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {adj.purpose}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                        {adj.date}
                      </div>
                    </div>
                    <div className="tabular-nums" style={{ fontWeight: 700, fontSize: 14, color: adj.type === 'deposit' ? 'var(--profit)' : 'var(--loss)', flexShrink: 0 }}>
                      {adj.type === 'deposit' ? '+' : '-'}₹{adj.amount.toLocaleString()}
                    </div>
                    <button
                      className="btn-icon btn-ghost"
                      onClick={() => {
                        if (window.confirm('Delete this adjustment?')) {
                          deleteCapitalAdjustment(adj.id);
                        }
                      }}
                      title="Delete"
                      style={{ flexShrink: 0 }}
                    >
                      <Trash2 size={14} style={{ color: 'var(--loss)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mistake Tags Manager */}
        <div className="stat-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} color="var(--accent)" />
            Custom Mistake Tags
          </h2>
          
          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <input
              className="input"
              placeholder="e.g. Traded While Tired"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              style={{ width: 42, height: 42, padding: 2, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
            />
            <button type="submit" className="btn btn-primary" disabled={!newTagName.trim()}>
              Add
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 300, overflowY: 'auto', alignContent: 'flex-start' }}>
            {mistakeTags.map(tag => (
              <div
                key={tag.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px 6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${tag.color}40`,
                  background: `${tag.color}15`,
                  color: tag.color,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {tag.name}
                <button
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 2, opacity: 0.7 }}
                  onClick={() => deleteMistakeTag(tag.id)}
                  title={!tag.isCustom ? "Cannot delete default tags" : "Delete Tag"}
                  disabled={!tag.isCustom}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Export */}
        <div className="stat-card">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} color="var(--accent)" />
            Data Management
          </h2>
          
          <p style={{ fontSize: 14, color: 'var(--fg-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
            All your trading data is currently stored locally in your browser. You can export it as a CSV file to analyze in Excel or Google Sheets.
          </p>

          <button className="btn btn-primary" onClick={handleExportCSV} style={{ width: '100%', marginBottom: 32 }}>
            <Download size={16} /> Export Trades to CSV
          </button>

        </div>

      </div>
    </motion.div>
  );
}
