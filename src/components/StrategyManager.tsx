'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingStore } from '@/store';
import { Target, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function StrategyManager() {
  const { strategies, addStrategy, updateStrategy, deleteStrategy, trades } = useTradingStore();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsAddingNew(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingId) {
      updateStrategy(editingId, { name, description });
    } else {
      addStrategy(name, description);
    }
    resetForm();
  };

  const startEditing = (strategy: any) => {
    setName(strategy.name);
    setDescription(strategy.description);
    setEditingId(strategy.id);
    setIsAddingNew(true);
  };

  // Calculate stats per strategy
  const strategyStats = strategies.map(s => {
    const strategyTrades = trades.filter(t => t.strategyId === s.id);
    const wins = strategyTrades.filter(t => t.netPnl > 0);
    const totalPnl = strategyTrades.reduce((sum, t) => sum + t.netPnl, 0);
    const winRate = strategyTrades.length > 0 ? (wins.length / strategyTrades.length) * 100 : 0;
    
    return {
      ...s,
      tradeCount: strategyTrades.length,
      winRate,
      totalPnl
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
            Trading Strategies
          </h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Define your setups and see which ones perform best.
          </p>
        </div>
        {!isAddingNew && (
          <button className="btn btn-primary" onClick={() => setIsAddingNew(true)}>
            <Plus size={16} /> New Strategy
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="stat-card"
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>
                {editingId ? 'Edit Strategy' : 'Create New Strategy'}
              </h2>
              <button className="btn-icon btn-ghost" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
              <div>
                <label className="input-label">Strategy Name</label>
                <input
                  className="input"
                  placeholder="e.g. ORB Breakout, Supply/Demand Reject"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Description & Rules</label>
                <textarea
                  className="textarea"
                  placeholder="Define the specific rules for entry, exit, and invalidation for this strategy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
                  <Save size={16} /> Save Strategy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {strategyStats.length > 0 ? (
          strategyStats.map((strategy) => (
            <motion.div key={strategy.id} layout className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={18} color="var(--accent)" />
                  {strategy.name}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon btn-ghost" onClick={() => startEditing(strategy)}>
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="btn-icon btn-ghost" 
                    onClick={() => {
                      if (window.confirm(`Delete strategy "${strategy.name}"? This will not delete past trades, but will untag them.`)) {
                        deleteStrategy(strategy.id);
                      }
                    }}
                  >
                    <Trash2 size={14} style={{ color: 'var(--loss)' }} />
                  </button>
                </div>
              </div>
              
              <p style={{ fontSize: 13, color: 'var(--fg-secondary)', flex: 1, marginBottom: 20, lineHeight: 1.5 }}>
                {strategy.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description provided.</span>}
              </p>

              <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trades</div>
                  <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>{strategy.tradeCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Win Rate</div>
                  <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: strategy.winRate >= 50 ? 'var(--profit)' : 'var(--loss)' }}>
                    {strategy.winRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net P&L</div>
                  <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: strategy.totalPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                    {strategy.totalPnl >= 0 ? '+' : ''}{strategy.totalPnl > 1000 || strategy.totalPnl < -1000 ? (strategy.totalPnl/1000).toFixed(1)+'k' : strategy.totalPnl.toFixed(0)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 12, textAlign: 'right' }}>
                Created {format(parseISO(strategy.createdAt), 'MMM dd, yyyy')}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <Target size={48} />
            <h3>No Strategies Yet</h3>
            <p>Add your first trading strategy to start tracking its performance over time.</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setIsAddingNew(true)}>
              <Plus size={16} /> Create Strategy
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
