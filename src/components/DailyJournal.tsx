'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useTradingStore } from '@/store';
import { MoodScore } from '@/types';
import { BookOpen, Calendar, Save, TrendingUp } from 'lucide-react';

const MOODS: { score: MoodScore; emoji: string; label: string; color: string }[] = [
  { score: 5, emoji: '🤩', label: 'Excellent', color: '#22c55e' },
  { score: 4, emoji: '😊', label: 'Good', color: '#3b82f6' },
  { score: 3, emoji: '😐', label: 'Neutral', color: '#9ca3af' },
  { score: 2, emoji: '😔', label: 'Poor', color: '#f59e0b' },
  { score: 1, emoji: '🤬', label: 'Terrible', color: '#ef4444' },
];

export function DailyJournal() {
  const { journals, upsertJournal, trades } = useTradingStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const existingJournal = useMemo(() => {
    return journals.find((j) => j.date === selectedDate) || null;
  }, [journals, selectedDate]);

  const dailyTrades = useMemo(() => {
    return trades.filter((t) => t.entryDate.startsWith(selectedDate));
  }, [trades, selectedDate]);

  const dailyPnl = useMemo(() => {
    return dailyTrades.reduce((sum, t) => sum + t.netPnl, 0);
  }, [dailyTrades]);

  const [reflection, setReflection] = useState(existingJournal?.reflectionText || '');
  const [marketBias, setMarketBias] = useState(existingJournal?.marketBias || '');
  const [mood, setMood] = useState<MoodScore>(existingJournal?.moodScore || 3);
  const [saved, setSaved] = useState(false);

  // Sync state when date changes
  useMemo(() => {
    setReflection(existingJournal?.reflectionText || '');
    setMarketBias(existingJournal?.marketBias || '');
    setMood(existingJournal?.moodScore || 3);
    setSaved(false);
  }, [existingJournal, selectedDate]);

  const handleSave = () => {
    upsertJournal(selectedDate, {
      reflectionText: reflection,
      marketBias,
      moodScore: mood,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
            Daily Journal
          </h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Reflect on your trading day to improve tomorrow.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Calendar size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--fg-muted)' }} />
          <input
            type="date"
            className="input tabular-nums"
            style={{ paddingLeft: 36, width: 160 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Editor */}
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} color="var(--accent)" />
              Entry for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
            </h3>
            {saved && (
              <span style={{ fontSize: 12, color: 'var(--profit)', fontWeight: 600 }}>
                Saved successfully!
              </span>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="input-label">How are you feeling today?</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {MOODS.map((m) => (
                <button
                  key={m.score}
                  onClick={() => setMood(m.score)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${mood === m.score ? m.color : 'var(--border)'}`,
                    background: mood === m.score ? `${m.color}15` : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: 1,
                    minWidth: 80,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: mood === m.score ? m.color : 'var(--fg-muted)' }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Market Bias & Observations</label>
            <textarea
              className="textarea"
              placeholder="What was the market doing today? Trending, chopping, news events?"
              value={marketBias}
              onChange={(e) => setMarketBias(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Reflections</label>
            <textarea
              className="textarea"
              placeholder="What did you do well? What mistakes did you make? What's the plan for tomorrow?"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={6}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSave}>
              <Save size={18} />
              Save Journal Entry
            </button>
          </div>
        </div>

        {/* Sidebar summary */}
        <div className="stat-card" style={{ position: 'sticky', top: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} /> Day Snapshot
          </h3>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Net P&L</div>
            <div
              className="tabular-nums"
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: dailyPnl >= 0 ? 'var(--profit)' : 'var(--loss)',
              }}
            >
              {dailyPnl >= 0 ? '+' : ''}₹{dailyPnl.toFixed(2)}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Trades Taken</div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>
              {dailyTrades.length}
            </div>
          </div>

          {dailyTrades.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>Trade List</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dailyTrades.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--fg)' }}>{t.symbol}</div>
                    <div className="tabular-nums" style={{ fontSize: 13, fontWeight: 700, color: t.netPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                      {t.netPnl >= 0 ? '+' : ''}{t.netPnl.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 320px"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
