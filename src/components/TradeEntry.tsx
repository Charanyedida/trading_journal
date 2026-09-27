'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingStore } from '@/store';
import {
  MarketType,
  MARKET_LABELS,
  MARKET_ICONS,
  EMOTION_LABELS,
  EmotionTag,
  TradeDirection,
  ChecklistResponse,
} from '@/types';
import {
  Save,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  AlertTriangle,
} from 'lucide-react';

export function TradeEntry() {
  const {
    marketConfigs,
    mistakeTags,
    checklists,
    strategies,
    addTrade,
    setActiveNav,
  } = useTradingStore();

  const enabledMarkets = marketConfigs.filter((m) => m.enabled);

  const [form, setForm] = useState({
    marketType: enabledMarkets[0]?.type || ('equity' as MarketType),
    symbol: '',
    direction: 'long' as TradeDirection,
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    plannedSL: '',
    actualSL: '',
    plannedTarget: '',
    actualTarget: '',
    fees: '',
    notes: '',
    emotionTag: '' as EmotionTag | '',
    strategyId: '',
    selectedMistakes: [] as string[],
  });

  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // Get applicable checklists
  const applicableChecklists = useMemo(() => {
    return checklists.filter(
      (c) => c.marketType === 'all' || c.marketType === form.marketType
    );
  }, [checklists, form.marketType]);

  // Calculate live P&L
  const livePnl = useMemo(() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const qty = parseFloat(form.quantity);
    if (isNaN(entry) || isNaN(exit) || isNaN(qty)) return null;

    const pnl =
      form.direction === 'long'
        ? (exit - entry) * qty
        : (entry - exit) * qty;
    const fees = parseFloat(form.fees) || 0;
    return { pnl, netPnl: pnl - fees };
  }, [form.entryPrice, form.exitPrice, form.quantity, form.direction, form.fees]);

  const handleSubmit = () => {
    const responses: ChecklistResponse[] = [];
    applicableChecklists.forEach((cl) => {
      cl.items.forEach((item) => {
        responses.push({
          checklistItemId: item.id,
          checked: checklistResponses[item.id] || false,
        });
      });
    });

    addTrade({
      marketType: form.marketType,
      symbol: form.symbol.toUpperCase(),
      direction: form.direction,
      entryDate: new Date(form.entryDate).toISOString(),
      exitDate: new Date(form.exitDate).toISOString(),
      entryPrice: parseFloat(form.entryPrice),
      exitPrice: parseFloat(form.exitPrice),
      quantity: parseFloat(form.quantity),
      plannedSL: form.plannedSL ? parseFloat(form.plannedSL) : null,
      actualSL: form.actualSL ? parseFloat(form.actualSL) : null,
      plannedTarget: form.plannedTarget ? parseFloat(form.plannedTarget) : null,
      actualTarget: form.actualTarget ? parseFloat(form.actualTarget) : null,
      fees: parseFloat(form.fees) || 0,
      screenshotUrl: null,
      notes: form.notes,
      emotionTag: form.emotionTag || null,
      strategyId: form.strategyId || null,
      mistakeTags: form.selectedMistakes,
      checklistResponses: responses,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setActiveNav('trade-log');
    }, 1500);
  };

  const isValid =
    form.symbol && form.entryPrice && form.exitPrice && form.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Log New Trade
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
          Record your trade details, emotions, and lessons learned.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Main Form */}
        <div>
          {/* Market & Direction */}
          <div className="stat-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 16 }}>
              Trade Details
            </h3>

            <div className="form-grid">
              <div>
                <label className="input-label">Market</label>
                <select
                  className="select"
                  value={form.marketType}
                  onChange={(e) => setForm({ ...form, marketType: e.target.value as MarketType })}
                >
                  {enabledMarkets.map((m) => (
                    <option key={m.type} value={m.type}>
                      {MARKET_ICONS[m.type]} {MARKET_LABELS[m.type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Symbol / Instrument</label>
                <input
                  className="input"
                  placeholder="e.g., NIFTY, EUR/USD, BTC"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label className="input-label">Direction</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn ${form.direction === 'long' ? 'btn-success' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setForm({ ...form, direction: 'long' })}
                  >
                    <ArrowUpRight size={16} />
                    Long
                  </button>
                  <button
                    className={`btn ${form.direction === 'short' ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setForm({ ...form, direction: 'short' })}
                  >
                    <ArrowDownRight size={16} />
                    Short
                  </button>
                </div>
              </div>

              {strategies.length > 0 && (
                <div>
                  <label className="input-label">Strategy</label>
                  <select
                    className="select"
                    value={form.strategyId}
                    onChange={(e) => setForm({ ...form, strategyId: e.target.value })}
                  >
                    <option value="">No strategy</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Prices */}
            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label className="input-label">Entry Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.entryDate}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Exit Date & Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.exitDate}
                  onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Entry Price</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Exit Price</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={form.exitPrice}
                  onChange={(e) => setForm({ ...form, exitPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Quantity / Lots</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Brokerage / Fees</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="0"
                  value={form.fees}
                  onChange={(e) => setForm({ ...form, fees: e.target.value })}
                />
              </div>
            </div>

            {/* SL & Target */}
            <div className="form-grid" style={{ marginTop: 16 }}>
              <div>
                <label className="input-label">Planned Stop-Loss</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="Optional"
                  value={form.plannedSL}
                  onChange={(e) => setForm({ ...form, plannedSL: e.target.value })}
                />
              </div>
              <div>
                <label className="input-label">Planned Target</label>
                <input
                  className="input tabular-nums"
                  type="number"
                  step="any"
                  placeholder="Optional"
                  value={form.plannedTarget}
                  onChange={(e) => setForm({ ...form, plannedTarget: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Notes & Emotions */}
          <div className="stat-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 16 }}>
              Psychology & Notes
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Emotional State</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(EMOTION_LABELS) as EmotionTag[]).map((tag) => {
                  const { label, emoji, color } = EMOTION_LABELS[tag];
                  const isSelected = form.emotionTag === tag;
                  return (
                    <button
                      key={tag}
                      className={`chip ${isSelected ? 'selected' : ''}`}
                      style={isSelected ? { borderColor: color, background: `${color}18`, color } : {}}
                      onClick={() => setForm({ ...form, emotionTag: isSelected ? '' : tag })}
                    >
                      {emoji} {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="input-label">Trade Notes / Rationale</label>
              <textarea
                className="textarea"
                placeholder="Why did you take this trade? What was your analysis?"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Mistake Tags */}
          <div className="stat-card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Mistake Tags
            </h3>
            <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 14 }}>
              Did you make any of these mistakes? (Select all that apply)
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mistakeTags.map((tag) => {
                const isSelected = form.selectedMistakes.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    className={`chip ${isSelected ? 'selected' : ''}`}
                    style={isSelected ? { borderColor: tag.color, background: `${tag.color}18`, color: tag.color } : {}}
                    onClick={() => {
                      setForm({
                        ...form,
                        selectedMistakes: isSelected
                          ? form.selectedMistakes.filter((id) => id !== tag.id)
                          : [...form.selectedMistakes, tag.id],
                      });
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Live P&L + Checklist */}
        <div style={{ position: 'sticky', top: 24 }}>
          {/* Live P&L Preview */}
          <div
            className="stat-card"
            style={{
              marginBottom: 16,
              background: livePnl
                ? livePnl.netPnl >= 0
                  ? 'var(--profit-bg)'
                  : 'var(--loss-bg)'
                : 'var(--surface)',
              borderColor: livePnl
                ? livePnl.netPnl >= 0
                  ? 'var(--profit-border)'
                  : 'var(--loss-border)'
                : 'var(--border)',
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 8 }}>
              ESTIMATED P&L
            </h3>
            <div
              className="tabular-nums"
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: livePnl
                  ? livePnl.netPnl >= 0
                    ? 'var(--profit)'
                    : 'var(--loss)'
                  : 'var(--fg-muted)',
                lineHeight: 1.2,
              }}
            >
              {livePnl ? `₹${livePnl.netPnl.toFixed(2)}` : '—'}
            </div>
            {livePnl && parseFloat(form.fees) > 0 && (
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }} className="tabular-nums">
                Gross: ₹{livePnl.pnl.toFixed(2)} | Fees: ₹{form.fees}
              </div>
            )}
          </div>

          {/* Pre-Trade Checklist */}
          {applicableChecklists.length > 0 && (
            <div className="stat-card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 14 }}>
                <Check size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Pre-Trade Checklist
              </h3>
              {applicableChecklists.map((cl) => (
                <div key={cl.id}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {cl.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cl.items.map((item) => (
                      <label key={item.id} className="checkbox-container">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={checklistResponses[item.id] || false}
                          onChange={(e) =>
                            setChecklistResponses({
                              ...checklistResponses,
                              [item.id]: e.target.checked,
                            })
                          }
                        />
                        <span style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.4 }}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <AnimatePresence>
            {saved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="btn btn-success btn-lg"
                style={{ width: '100%', justifyContent: 'center', pointerEvents: 'none' }}
              >
                <Check size={20} />
                Trade Saved!
              </motion.div>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleSubmit}
                disabled={!isValid}
              >
                <Save size={18} />
                Save Trade
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile responsive override */}
      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 360px"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
