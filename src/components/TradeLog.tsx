'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useTradingStore } from '@/store';
import { MarketType, MARKET_LABELS, Trade, MistakeTag } from '@/types';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, ArrowUpDown } from 'lucide-react';

export function TradeLog() {
  const { trades, mistakeTags, deleteTrade, marketConfigs } = useTradingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Trade; direction: 'asc' | 'desc' }>({
    key: 'entryDate',
    direction: 'desc',
  });

  const enabledMarkets = marketConfigs.filter((m) => m.enabled);

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
    </motion.div>
  );
}
