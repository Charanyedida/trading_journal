'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useTradingStore } from '@/store';
import { MarketType, MARKET_LABELS, Trade, MistakeTag, EMOTION_LABELS, EmotionTag, TradeDirection } from '@/types';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowUpDown, Pencil, X, Save, Check } from 'lucide-react';

export function TradeLog() {
  const { trades, mistakeTags, strategies, deleteTrade, updateTrade, marketConfigs } = useTradingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trade; direction: 'asc' | 'desc' }>({
    key: 'entryDate',
    direction: 'desc',
  });

  // Edit modal state
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [editForm, setEditForm] = useState<{
    symbol: string;
    direction: TradeDirection;
    entryDate: string;
    exitDate: string;
    entryPrice: string;
    exitPrice: string;
    quantity: string;
    plannedSL: string;
    plannedTarget: string;
    fees: string;
    notes: string;
    emotionTag: EmotionTag | '';
    strategyId: string;
  } | null>(null);
  const [editSaved, setEditSaved] = useState(false);

  const enabledMarkets = marketConfigs.filter((m) => m.enabled);

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({
      symbol: trade.symbol,
      direction: trade.direction,
      entryDate: trade.entryDate.slice(0, 16),
      exitDate: trade.exitDate.slice(0, 16),
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      quantity: trade.quantity.toString(),
      plannedSL: trade.plannedSL?.toString() || '',
      plannedTarget: trade.plannedTarget?.toString() || '',
      fees: trade.fees.toString(),
      notes: trade.notes,
      emotionTag: trade.emotionTag || '',
      strategyId: trade.strategyId || '',
    });
    setEditSaved(false);
  };

  const closeEditModal = () => {
    setEditingTrade(null);
    setEditForm(null);
    setEditSaved(false);
  };

  const handleSaveEdit = () => {
    if (!editingTrade || !editForm) return;
    updateTrade(editingTrade.id, {
      symbol: editForm.symbol.toUpperCase(),
      direction: editForm.direction,
      entryDate: new Date(editForm.entryDate).toISOString(),
      exitDate: new Date(editForm.exitDate).toISOString(),
      entryPrice: parseFloat(editForm.entryPrice),
      exitPrice: parseFloat(editForm.exitPrice),
      quantity: parseFloat(editForm.quantity),
      plannedSL: editForm.plannedSL ? parseFloat(editForm.plannedSL) : null,
      plannedTarget: editForm.plannedTarget ? parseFloat(editForm.plannedTarget) : null,
      fees: parseFloat(editForm.fees) || 0,
      notes: editForm.notes,
      emotionTag: editForm.emotionTag || null,
      strategyId: editForm.strategyId || null,
    });
    setEditSaved(true);
    setTimeout(() => {
      closeEditModal();
    }, 1200);
  };

  // Calculate live P&L for edit form
  const editLivePnl = useMemo(() => {
    if (!editForm) return null;
    const entry = parseFloat(editForm.entryPrice);
    const exit = parseFloat(editForm.exitPrice);
    const qty = parseFloat(editForm.quantity);
    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return null;
    const pnl = editForm.direction === 'long'
      ? (exit - entry) * qty
      : (entry - exit) * qty;
    const fees = parseFloat(editForm.fees) || 0;
    return { pnl, netPnl: pnl - fees };
  }, [editForm]);

  const isEditValid = editForm && editForm.symbol && editForm.entryPrice && editForm.exitPrice && editForm.quantity;

  const handleSort = (key: keyof Trade) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    // Filter by market
    if (marketFilter !== 'all') {
      result = result.filter((t) => t.marketType === marketFilter);
    }

    // Search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(lower) ||
          t.notes.toLowerCase().includes(lower) ||
          t.emotionTag?.toLowerCase().includes(lower)
      );
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA === null || valB === null) return 0;
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [trades, marketFilter, searchTerm, sortConfig]);

  const getTagsForTrade = (tradeMistakes: string[]) => {
    return tradeMistakes
      .map((id) => mistakeTags.find((mt) => mt.id === id))
      .filter(Boolean) as MistakeTag[];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Trade Log
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
          Review and analyze all your past trades.
        </p>
      </div>

      <div className="stat-card" style={{ padding: '20px 24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 500 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--fg-muted)' }} />
              <input
                className="input"
                placeholder="Search symbol, notes, or tags..."
                style={{ paddingLeft: 36 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {enabledMarkets.length > 1 && (
              <div style={{ position: 'relative', width: 160 }}>
                <Filter size={14} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--fg-muted)', zIndex: 1 }} />
                <select
                  className="select"
                  style={{ paddingLeft: 34 }}
                  value={marketFilter}
                  onChange={(e) => setMarketFilter(e.target.value as MarketType | 'all')}
                >
                  <option value="all">All Markets</option>
                  {enabledMarkets.map((m) => (
                    <option key={m.type} value={m.type}>{MARKET_LABELS[m.type]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center' }}>
            Showing {filteredAndSortedTrades.length} trades
          </div>
        </div>

        {/* Table */}
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
          <table>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('entryDate')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Date <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Market</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('symbol')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Symbol <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Direction</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('netPnl')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Net P&L <ArrowUpDown size={12} />
                  </div>
                </th>
                <th>Mistakes / Tags</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTrades.length > 0 ? (
                filteredAndSortedTrades.map((trade) => {
                  const tags = getTagsForTrade(trade.mistakeTags);
                  return (
                    <tr key={trade.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500, color: 'var(--fg)' }}>
                          {format(parseISO(trade.entryDate), 'MMM dd, yyyy')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                          {format(parseISO(trade.entryDate), 'HH:mm')} - {format(parseISO(trade.exitDate), 'HH:mm')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {MARKET_LABELS[trade.marketType]}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--fg)' }}>{trade.symbol}</div>
                        <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                          Qty: {trade.quantity}
                        </div>
                      </td>
                      <td>
                        {trade.direction === 'long' ? (
                          <span className="badge badge-success" style={{ background: 'var(--profit-bg)', color: 'var(--profit)', border: 'none' }}>
                            <ArrowUpRight size={14} /> Long
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ background: 'var(--loss-bg)', color: 'var(--loss)', border: 'none' }}>
                            <ArrowDownRight size={14} /> Short
                          </span>
                        )}
                      </td>
                      <td>
                        <div
                          className="tabular-nums"
                          style={{
                            fontWeight: 700,
                            color: trade.netPnl >= 0 ? 'var(--profit)' : 'var(--loss)'
                          }}
                        >
                          {trade.netPnl >= 0 ? '+' : ''}{trade.netPnl.toFixed(2)}
                        </div>
                        <div className="tabular-nums" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                          {trade.pnlPercent.toFixed(2)}%
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {tags.length > 0 ? (
                            tags.map((t) => (
                              <span
                                key={t.id}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: `${t.color}15`,
                                  color: t.color,
                                  border: `1px solid ${t.color}30`,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {t.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>-</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            className="btn-icon btn-ghost"
                            onClick={() => openEditModal(trade)}
                            title="Edit Trade"
                          >
                            <Pencil size={16} style={{ color: 'var(--accent)' }} />
                          </button>
                          <button
                            className="btn-icon btn-ghost"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this trade?')) {
                                deleteTrade(trade.id);
                              }
                            }}
                            title="Delete Trade"
                          >
                            <Trash2 size={16} style={{ color: 'var(--loss)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-muted)' }}>
                    No trades found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Trade Modal */}
      <AnimatePresence>
        {editingTrade && editForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeEditModal}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: 520,
                maxWidth: '100vw',
                background: 'var(--bg)',
                borderLeft: '1px solid var(--border)',
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg)', marginBottom: 2 }}>
                    Edit Trade
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>
                    {editingTrade.symbol} — {format(parseISO(editingTrade.entryDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <button className="btn-icon btn-ghost" onClick={closeEditModal}>
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {/* Core Details */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 14 }}>
                    Trade Details
                  </h3>
                  <div className="form-grid">
                    <div>
                      <label className="input-label">Symbol</label>
                      <input
                        className="input"
                        value={editForm.symbol}
                        onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label className="input-label">Direction</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={`btn ${editForm.direction === 'long' ? 'btn-success' : 'btn-secondary'}`}
                          style={{ flex: 1 }}
                          onClick={() => setEditForm({ ...editForm, direction: 'long' })}
                        >
                          <ArrowUpRight size={14} /> Long
                        </button>
                        <button
                          className={`btn ${editForm.direction === 'short' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ flex: 1 }}
                          onClick={() => setEditForm({ ...editForm, direction: 'short' })}
                        >
                          <ArrowDownRight size={14} /> Short
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: 12 }}>
                    <div>
                      <label className="input-label">Entry Date & Time</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={editForm.entryDate}
                        onChange={(e) => setEditForm({ ...editForm, entryDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Exit Date & Time</label>
                      <input
                        className="input"
                        type="datetime-local"
                        value={editForm.exitDate}
                        onChange={(e) => setEditForm({ ...editForm, exitDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: 12 }}>
                    <div>
                      <label className="input-label">Entry Price</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        value={editForm.entryPrice}
                        onChange={(e) => setEditForm({ ...editForm, entryPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Exit Price</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        value={editForm.exitPrice}
                        onChange={(e) => setEditForm({ ...editForm, exitPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Quantity</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Fees</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        value={editForm.fees}
                        onChange={(e) => setEditForm({ ...editForm, fees: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid" style={{ marginTop: 12 }}>
                    <div>
                      <label className="input-label">Planned Stop-Loss</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={editForm.plannedSL}
                        onChange={(e) => setEditForm({ ...editForm, plannedSL: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Planned Target</label>
                      <input
                        className="input tabular-nums"
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={editForm.plannedTarget}
                        onChange={(e) => setEditForm({ ...editForm, plannedTarget: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Psychology */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 14 }}>
                    Psychology & Notes
                  </h3>

                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">Emotional State</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(Object.keys(EMOTION_LABELS) as EmotionTag[]).map((tag) => {
                        const { label, emoji, color } = EMOTION_LABELS[tag];
                        const isSelected = editForm.emotionTag === tag;
                        return (
                          <button
                            key={tag}
                            className={`chip ${isSelected ? 'selected' : ''}`}
                            style={isSelected ? { borderColor: color, background: `${color}18`, color } : {}}
                            onClick={() => setEditForm({ ...editForm, emotionTag: isSelected ? '' : tag })}
                          >
                            {emoji} {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {strategies.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="input-label">Strategy</label>
                      <select
                        className="select"
                        value={editForm.strategyId}
                        onChange={(e) => setEditForm({ ...editForm, strategyId: e.target.value })}
                      >
                        <option value="">No strategy</option>
                        {strategies.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="input-label">Notes</label>
                    <textarea
                      className="textarea"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Live P&L Preview */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    marginBottom: 16,
                    background: editLivePnl
                      ? editLivePnl.netPnl >= 0
                        ? 'var(--profit-bg, rgba(34,197,94,0.08))'
                        : 'var(--loss-bg, rgba(239,68,68,0.08))'
                      : 'var(--surface)',
                    border: `1px solid ${editLivePnl
                      ? editLivePnl.netPnl >= 0
                        ? 'var(--profit-border, rgba(34,197,94,0.2))'
                        : 'var(--loss-border, rgba(239,68,68,0.2))'
                      : 'var(--border)'}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Updated P&L
                  </div>
                  <div
                    className="tabular-nums"
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: editLivePnl
                        ? editLivePnl.netPnl >= 0 ? 'var(--profit)' : 'var(--loss)'
                        : 'var(--fg-muted)',
                    }}
                  >
                    {editLivePnl ? `₹${editLivePnl.netPnl.toFixed(2)}` : '—'}
                  </div>
                  {editLivePnl && parseFloat(editForm.fees) > 0 && (
                    <div className="tabular-nums" style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                      Gross: ₹{editLivePnl.pnl.toFixed(2)} | Fees: ₹{editForm.fees}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: 12,
                flexShrink: 0,
              }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <AnimatePresence mode="wait">
                  {editSaved ? (
                    <motion.button
                      key="saved"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="btn btn-success"
                      style={{ flex: 1, justifyContent: 'center', pointerEvents: 'none' }}
                    >
                      <Check size={18} /> Saved!
                    </motion.button>
                  ) : (
                    <motion.button
                      key="save"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={handleSaveEdit}
                      disabled={!isEditValid}
                    >
                      <Save size={18} /> Save Changes
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
