'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { useTradingStore } from '@/store';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const INDIAN_HOLIDAYS = [
  '01-26', // Republic Day
  '05-01', // Maharashtra Day
  '08-15', // Independence Day
  '10-02', // Gandhi Jayanti
  '12-25', // Christmas
];

const isHoliday = (date: Date) => {
  const md = format(date, 'MM-dd');
  return INDIAN_HOLIDAYS.includes(md);
};

export function CalendarView() {
  const { trades, journals, setActiveNav, setSelectedJournalDate, selectedJournalDate } = useTradingStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const pnlByDay = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number }> = {};
    trades.forEach((t) => {
      const day = t.entryDate.split('T')[0];
      if (!map[day]) map[day] = { pnl: 0, trades: 0 };
      map[day].pnl += t.netPnl;
      map[day].trades++;
    });
    return map;
  }, [trades]);

  const monthStats = useMemo(() => {
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    const monthTrades = trades.filter((t) => t.entryDate.startsWith(currentMonthStr));
    
    const wins = monthTrades.filter((t) => t.netPnl > 0);
    const losses = monthTrades.filter((t) => t.netPnl < 0);
    
    return {
      netPnl: monthTrades.reduce((sum, t) => sum + t.netPnl, 0),
      trades: monthTrades.length,
      winRate: monthTrades.length > 0 ? (wins.length / monthTrades.length) * 100 : 0,
      greenDays: Object.entries(pnlByDay).filter(([date, data]) => date.startsWith(currentMonthStr) && data.pnl > 0).length,
      redDays: Object.entries(pnlByDay).filter(([date, data]) => date.startsWith(currentMonthStr) && data.pnl < 0).length,
    };
  }, [trades, currentDate, pnlByDay]);

  const getColorForPnl = (pnl: number) => {
    if (pnl > 0) return 'var(--profit-bg)';
    if (pnl < 0) return 'var(--loss-bg)';
    return 'var(--surface-hover)';
  };

  const getTextColorForPnl = (pnl: number) => {
    if (pnl > 0) return 'var(--profit)';
    if (pnl < 0) return 'var(--loss)';
    return 'var(--fg-muted)';
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
            Trading Calendar
          </h1>
          <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
            Visualize your performance and consistency day by day. Click any day to open its journal.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Calendar Grid */}
        <div className="stat-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={20} color="var(--accent)" />
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon btn-secondary" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft size={18} />
              </button>
              <button className="btn-secondary btn-sm" style={{ borderRadius: 'var(--radius-md)', fontWeight: 600 }} onClick={() => setCurrentDate(new Date())}>
                Today
              </button>
              <button className="btn-icon btn-secondary" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--fg-muted)', padding: '8px 0' }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {daysInMonth.map((day, i) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const data = pnlByDay[dateStr];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const weekend = day.getDay() === 0 || day.getDay() === 6;
              const holiday = isHoliday(day);
              const nonTradingDay = weekend || holiday;
              const isSelected = selectedJournalDate === dateStr;
              const hasJournal = journals?.some(
                (j) => j.date === dateStr && (j.reflectionText?.trim() || j.marketBias?.trim())
              );

              return (
                <div
                  key={i}
                  className="calendar-day-tile"
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected
                      ? '2px solid var(--accent)'
                      : `1px solid ${today ? 'var(--accent)' : 'var(--border)'}`,
                    boxShadow: isSelected ? '0 0 0 2px var(--accent-glow)' : undefined,
                    background: data
                      ? getColorForPnl(data.pnl)
                      : nonTradingDay
                      ? 'var(--bg-secondary)'
                      : 'var(--surface)',
                    opacity: isCurrentMonth ? 1 : 0.4,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                  }}
                  title={`Open journal for ${dateStr}${data ? ` (${data.trades} trades, P&L: ₹${data.pnl.toFixed(0)})` : ''}`}
                  onClick={() => {
                    setSelectedJournalDate(dateStr);
                    setActiveNav('journal');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: data ? getTextColorForPnl(data.pnl) : (nonTradingDay ? 'var(--loss)' : 'var(--fg-muted)') }}>
                      {format(day, 'd')}
                      {holiday && !data && <span style={{ fontSize: 10, display: 'block', fontWeight: 400, opacity: 0.7 }}>Holiday</span>}
                    </div>
                    {hasJournal && (
                      <span
                        title="Has journal entry"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          boxShadow: '0 0 6px var(--accent-glow)',
                          display: 'inline-block',
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                  </div>
                  {data && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div className="tabular-nums" style={{ fontSize: 12, fontWeight: 800, color: getTextColorForPnl(data.pnl) }}>
                        {data.pnl > 0 ? '+' : ''}{data.pnl >= 1000 || data.pnl <= -1000 ? (data.pnl / 1000).toFixed(1) + 'k' : data.pnl.toFixed(0)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--fg-muted)' }}>
                        {data.trades} trades
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Summary */}
        <div className="stat-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)', marginBottom: 20 }}>
            {format(currentDate, 'MMMM')} Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Net P&L</div>
              <div
                className="tabular-nums"
                style={{ fontSize: 28, fontWeight: 800, color: monthStats.netPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}
              >
                {monthStats.netPnl >= 0 ? '+' : ''}₹{monthStats.netPnl.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Win Rate</div>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>
                  {monthStats.winRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Total Trades</div>
                <div className="tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>
                  {monthStats.trades}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 8 }}>Consistency</div>
              <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--border)' }}>
                <div style={{ width: `${(monthStats.greenDays / (monthStats.greenDays + monthStats.redDays || 1)) * 100}%`, background: 'var(--profit)' }} />
                <div style={{ width: `${(monthStats.redDays / (monthStats.greenDays + monthStats.redDays || 1)) * 100}%`, background: 'var(--loss)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--profit)', fontWeight: 600 }}>{monthStats.greenDays} Green Days</span>
                <span style={{ color: 'var(--loss)', fontWeight: 600 }}>{monthStats.redDays} Red Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .calendar-day-tile:hover {
          transform: translateY(-2px);
          border-color: var(--accent) !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          z-index: 2;
        }
        .calendar-day-tile:active {
          transform: scale(0.98);
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 300px"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
