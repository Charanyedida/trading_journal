'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTradingStore } from '@/store';
import { BarChart3, Clock, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from 'recharts';
import { parseISO, getDay, getHours } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Analytics() {
  const { trades } = useTradingStore();

  // Day of Week Performance
  const dayOfWeekStats = useMemo(() => {
    const map: Record<number, { count: number; pnl: number }> = {};
    for (let i = 0; i < 7; i++) map[i] = { count: 0, pnl: 0 };
    
    trades.forEach(t => {
      const day = getDay(parseISO(t.entryDate));
      map[day].count++;
      map[day].pnl += t.netPnl;
    });

    return DAYS.map((day, i) => ({
      name: day,
      ...map[i]
    })).filter(d => d.count > 0 || d.name === 'Mon' || d.name === 'Fri'); // keep some days for visual structure
  }, [trades]);

  // Hour of Day Performance
  const hourOfDayStats = useMemo(() => {
    const map: Record<number, { count: number; pnl: number }> = {};
    
    trades.forEach(t => {
      const hour = getHours(parseISO(t.entryDate));
      if (!map[hour]) map[hour] = { count: 0, pnl: 0 };
      map[hour].count++;
      map[hour].pnl += t.netPnl;
    });

    return Object.entries(map)
      .sort(([h1], [h2]) => Number(h1) - Number(h2))
      .map(([hour, data]) => ({
        name: `${hour.padStart(2, '0')}:00`,
        ...data
      }));
  }, [trades]);

  // Long vs Short
  const directionStats = useMemo(() => {
    const long = trades.filter(t => t.direction === 'long');
    const short = trades.filter(t => t.direction === 'short');
    
    const lPnl = long.reduce((sum, t) => sum + t.netPnl, 0);
    const sPnl = short.reduce((sum, t) => sum + t.netPnl, 0);

    const lWins = long.filter(t => t.netPnl > 0).length;
    const sWins = short.filter(t => t.netPnl > 0).length;

    return {
      long: { count: long.length, pnl: lPnl, winRate: long.length > 0 ? (lWins / long.length)*100 : 0 },
      short: { count: short.length, pnl: sPnl, winRate: short.length > 0 ? (sWins / short.length)*100 : 0 }
    };
  }, [trades]);

  const formatCurrency = (val: number) => {
    return (val >= 0 ? '+' : '') + '₹' + Math.abs(val).toFixed(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Deep Analytics
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
          Find your statistical edge by analyzing your performance across different dimensions.
        </p>
      </div>

      {trades.length === 0 ? (
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No Data Available</h3>
          <p>You need to log trades before we can generate deep analytics.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          
          {/* Top row: Long vs Short & General Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            <div className="stat-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowUpRight size={18} color="var(--profit)" />
                Long Positions
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total Trades</div>
                <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700 }}>{directionStats.long.count}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Win Rate</div>
                <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: directionStats.long.winRate >= 50 ? 'var(--profit)' : 'var(--loss)' }}>
                  {directionStats.long.winRate.toFixed(1)}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Net P&L</div>
                <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: directionStats.long.pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                  {formatCurrency(directionStats.long.pnl)}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowDownRight size={18} color="var(--loss)" />
                Short Positions
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total Trades</div>
                <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700 }}>{directionStats.short.count}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Win Rate</div>
                <div className="tabular-nums" style={{ fontSize: 16, fontWeight: 700, color: directionStats.short.winRate >= 50 ? 'var(--profit)' : 'var(--loss)' }}>
                  {directionStats.short.winRate.toFixed(1)}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Net P&L</div>
                <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: directionStats.short.pnl >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                  {formatCurrency(directionStats.short.pnl)}
                </div>
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
            
            {/* Day of week */}
            <div className="stat-card" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarDays size={18} color="var(--accent)" />
                Performance by Day of Week
              </h3>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 20 }}>Net P&L grouped by the day you entered the trade.</p>
              
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => val > 1000 || val < -1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }}
                      formatter={(val: number) => [formatCurrency(val), 'Net P&L']}
                      labelStyle={{ color: 'var(--fg-muted)' }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {dayOfWeekStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--profit)' : 'var(--loss)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hour of day */}
            <div className="stat-card" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="var(--accent)" />
                Performance by Hour of Day
              </h3>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 20 }}>Net P&L based on the hour you entered the trade.</p>
              
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourOfDayStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => val > 1000 || val < -1000 ? `${(val/1000).toFixed(0)}k` : val} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)' }}
                      formatter={(val: number) => [formatCurrency(val), 'Net P&L']}
                      labelStyle={{ color: 'var(--fg-muted)' }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {hourOfDayStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'var(--profit)' : 'var(--loss)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}
    </motion.div>
  );
}
