'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTradingStore } from '@/store';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  BarChart3,
  Flame,
  PieChart,
  Zap,
  Wallet,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { MARKET_LABELS, MarketType } from '@/types';

function formatCurrency(val: number, currency = '₹'): string {
  const abs = Math.abs(val);
  if (abs >= 10000000) return `${currency}${(val / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${currency}${(val / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${currency}${(val / 1000).toFixed(1)}K`;
  return `${currency}${val.toFixed(2)}`;
}

function AnimatedValue({ value, prefix = '', suffix = '' }: { value: string | number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  );
}

export function Dashboard() {
  const { trades, mistakeTags, checklists, filters, setFilters, preferences, capitalHistory, capitalAdjustments } = useTradingStore();

  const filteredTrades = useMemo(() => {
    let t = [...trades];
    if (filters.marketType !== 'all') {
      t = t.filter((tr) => tr.marketType === filters.marketType);
    }
    if (filters.strategyId) {
      t = t.filter((tr) => tr.strategyId === filters.strategyId);
    }
    return t;
  }, [trades, filters]);

  const stats = useMemo(() => {
    const total = filteredTrades.length;
    if (total === 0) {
      return {
        totalPnl: 0,
        totalNetPnl: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        bestDay: null as { date: string; pnl: number } | null,
        worstDay: null as { date: string; pnl: number } | null,
        currentStreak: { type: 'win' as const, count: 0 },
        ruleAdherence: 0,
      };
    }

    const wins = filteredTrades.filter((t) => t.netPnl > 0);
    const losses = filteredTrades.filter((t) => t.netPnl < 0);

    const totalPnl = filteredTrades.reduce((s, t) => s + t.pnl, 0);
    const totalNetPnl = filteredTrades.reduce((s, t) => s + t.netPnl, 0);
    const winRate = (wins.length / total) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.netPnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.netPnl, 0) / losses.length) : 0;
    const grossWins = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLosses = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0;

    // Best/worst day
    const dayMap: Record<string, number> = {};
    filteredTrades.forEach((t) => {
      const day = t.entryDate.split('T')[0];
      dayMap[day] = (dayMap[day] || 0) + t.netPnl;
    });
    let bestDay: { date: string; pnl: number } | null = null;
    let worstDay: { date: string; pnl: number } | null = null;
    Object.entries(dayMap).forEach(([date, pnl]) => {
      if (!bestDay || pnl > bestDay.pnl) bestDay = { date, pnl };
      if (!worstDay || pnl < worstDay.pnl) worstDay = { date, pnl };
    });

    // Current streak
    const sorted = [...filteredTrades].sort(
      (a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()
    );
    let streakType: 'win' | 'loss' = sorted[0]?.netPnl >= 0 ? 'win' : 'loss';
    let streakCount = 0;
    for (const t of sorted) {
      if ((streakType === 'win' && t.netPnl >= 0) || (streakType === 'loss' && t.netPnl < 0)) {
        streakCount++;
      } else {
        break;
      }
    }

    // Rule adherence
    let totalChecks = 0;
    let checkedCount = 0;
    filteredTrades.forEach((t) => {
      t.checklistResponses.forEach((r) => {
        totalChecks++;
        if (r.checked) checkedCount++;
      });
    });
    const ruleAdherence = totalChecks > 0 ? (checkedCount / totalChecks) * 100 : 0;

    return {
      totalPnl,
      totalNetPnl,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalTrades: total,
      winningTrades: wins.length,
      losingTrades: losses.length,
      bestDay,
      worstDay,
      currentStreak: { type: streakType, count: streakCount },
      ruleAdherence,
    };
  }, [filteredTrades]);

  // Equity curve data
  const equityCurve = useMemo(() => {
    const sorted = [...filteredTrades].sort(
      (a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
    );
    let cum = 0;
    return sorted.map((t) => {
      cum += t.netPnl;
      return {
        date: format(parseISO(t.exitDate), 'MMM dd'),
        pnl: cum,
        dailyPnl: t.netPnl,
      };
    });
  }, [filteredTrades]);

  // Capital tracking — use the persisted currentCapital from preferences
  const currentCapital = useMemo(() => {
    if (preferences.startingCapital === undefined) return null;
    if (preferences.currentCapital !== undefined) return preferences.currentCapital;
    // Fallback: if currentCapital not yet persisted, derive from history
    if (capitalHistory.length === 0) return preferences.startingCapital;
    return capitalHistory[capitalHistory.length - 1].capitalAfter;
  }, [preferences.startingCapital, preferences.currentCapital, capitalHistory]);

  const capitalStats = useMemo(() => {
    if (preferences.startingCapital === undefined || currentCapital === null) return null;
    
    // Find today's date from local time
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayTrades = filteredTrades.filter(t => t.exitDate.startsWith(todayStr));
    const todayPnl = todayTrades.reduce((s, t) => s + t.netPnl, 0);
    const todayLosses = Math.abs(todayTrades.filter(t => t.netPnl < 0).reduce((s, t) => s + t.netPnl, 0));
    
    // Find yesterday's capital to compute % change
    let yesterdayCapital = preferences.startingCapital;
    if (capitalHistory.length > 0) {
      const todayEntry = capitalHistory.find(c => c.date === todayStr);
      if (todayEntry) {
        yesterdayCapital = todayEntry.capitalBefore;
      } else {
        yesterdayCapital = capitalHistory[capitalHistory.length - 1].capitalAfter;
      }
    }
    const todayPct = yesterdayCapital ? (todayPnl / yesterdayCapital) * 100 : 0;
    
    const riskPerTrade = currentCapital * (preferences.riskPerTradePct || 1.0) / 100;
    const maxDailyRisk = currentCapital * (preferences.maxDailyRiskPct || 3.0) / 100;
    
    return {
      todayPnl,
      todayPct,
      todayLosses,
      riskPerTrade,
      maxDailyRisk
    };
  }, [preferences, currentCapital, capitalHistory, filteredTrades]);

  // Mistake analysis
  const mistakeAnalysis = useMemo(() => {
    const tagMap: Record<string, { count: number; totalPnl: number; name: string }> = {};
    filteredTrades.forEach((t) => {
      t.mistakeTags.forEach((tagId) => {
        const tag = mistakeTags.find((mt) => mt.id === tagId);
        if (tag) {
          if (!tagMap[tagId]) tagMap[tagId] = { count: 0, totalPnl: 0, name: tag.name };
          tagMap[tagId].count++;
          tagMap[tagId].totalPnl += t.netPnl;
        }
      });
    });
    return Object.values(tagMap)
      .sort((a, b) => a.totalPnl - b.totalPnl)
      .slice(0, 8);
  }, [filteredTrades, mistakeTags]);

  // Market-wise breakdown
  const marketBreakdown = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number; wins: number }> = {};
    filteredTrades.forEach((t) => {
      if (!map[t.marketType]) map[t.marketType] = { pnl: 0, trades: 0, wins: 0 };
      map[t.marketType].pnl += t.netPnl;
      map[t.marketType].trades++;
      if (t.netPnl > 0) map[t.marketType].wins++;
    });
    return Object.entries(map).map(([type, data]) => ({
      market: MARKET_LABELS[type as MarketType],
      ...data,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    }));
  }, [filteredTrades]);

  const enabledMarkets = useTradingStore((s) => s.marketConfigs).filter((m) => m.enabled);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
              Welcome back, {preferences.name || 'Trader'} 👋
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
              {filteredTrades.length > 0
                ? "Here's your trading performance at a glance."
                : 'Start logging your trades to see your analytics.'}
            </p>
          </div>

          {/* Market filter tabs */}
          {enabledMarkets.length > 1 && (
            <div className="tabs">
              <button
                className={`tab ${filters.marketType === 'all' ? 'active' : ''}`}
                onClick={() => setFilters({ marketType: 'all' })}
              >
                All Markets
              </button>
              {enabledMarkets.map((m) => (
                <button
                  key={m.type}
                  className={`tab ${filters.marketType === m.type ? 'active' : ''}`}
                  onClick={() => setFilters({ marketType: m.type })}
                >
                  {MARKET_LABELS[m.type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Capital Setup Prompt */}
      {preferences.startingCapital === undefined && (
        <motion.div variants={itemVariants} className="stat-card" style={{ marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} color="var(--accent)" />
                Set up your trading capital
              </h3>
              <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>Unlock capital tracking & risk suggestions by setting your starting capital.</p>
            </div>
            <button className="btn btn-primary" onClick={() => useTradingStore.getState().setActiveNav('settings')}>
              Set Up Capital
            </button>
          </div>
        </motion.div>
      )}

      {/* Capital & Risk Cards */}
      {preferences.startingCapital !== undefined && currentCapital !== null && capitalStats && (
        <motion.div variants={itemVariants} className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Current Capital Card */}
          <div className="stat-card">
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ color: 'var(--accent)', opacity: 0.8 }}><Wallet size={20} /></div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)' }}>Current Capital</span>
             </div>
             <div className="tabular-nums" style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', lineHeight: 1.2 }}>
               {formatCurrency(currentCapital)}
             </div>
             <div style={{ fontSize: 13, marginTop: 8, color: capitalStats.todayPnl >= 0 ? 'var(--profit)' : 'var(--loss)' }} className="tabular-nums">
               {capitalStats.todayPnl >= 0 ? '+' : ''}{formatCurrency(capitalStats.todayPnl)} today ({capitalStats.todayPct >= 0 ? '+' : ''}{capitalStats.todayPct.toFixed(2)}%)
             </div>
             {/* Starting capital & adjustments info */}
             <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)' }}>
                 <span>Starting Capital:</span>
                 <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--fg)' }}>{formatCurrency(preferences.startingCapital!)}</span>
               </div>
               {capitalAdjustments.length > 0 && (() => {
                 const totalDeposits = capitalAdjustments.filter(a => a.type === 'deposit').reduce((s, a) => s + a.amount, 0);
                 const totalWithdrawals = capitalAdjustments.filter(a => a.type === 'withdrawal').reduce((s, a) => s + a.amount, 0);
                 return (
                   <>
                     {totalDeposits > 0 && (
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)' }}>
                         <span>Total Deposited:</span>
                         <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--profit)' }}>+{formatCurrency(totalDeposits)}</span>
                       </div>
                     )}
                     {totalWithdrawals > 0 && (
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)' }}>
                         <span>Total Withdrawn:</span>
                         <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--loss)' }}>-{formatCurrency(totalWithdrawals)}</span>
                       </div>
                     )}
                   </>
                 );
               })()}
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)' }}>
                 <span>Overall Return:</span>
                 {(() => {
                   // True trading return = exclude deposits/withdrawals
                   const totalDeposits = capitalAdjustments.filter(a => a.type === 'deposit').reduce((s, a) => s + a.amount, 0);
                   const totalWithdrawals = capitalAdjustments.filter(a => a.type === 'withdrawal').reduce((s, a) => s + a.amount, 0);
                   const tradingReturn = currentCapital - preferences.startingCapital! - totalDeposits + totalWithdrawals;
                   const returnPct = preferences.startingCapital! > 0 ? (tradingReturn / preferences.startingCapital! * 100) : 0;
                   return (
                     <span className="tabular-nums" style={{ fontWeight: 600, color: tradingReturn >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                       {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                     </span>
                   );
                 })()}
               </div>
             </div>
          </div>
          
          {/* Risk Guide Card */}
          <div className="stat-card">
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ color: 'var(--warning)', opacity: 0.8 }}><ShieldAlert size={20} /></div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)' }}>Risk Guide</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                   <span style={{ color: 'var(--fg-muted)' }}>Safe risk per trade:</span>
                   <span style={{ fontWeight: 600, color: 'var(--fg)' }} className="tabular-nums">{formatCurrency(capitalStats.riskPerTrade)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                   <span style={{ color: 'var(--fg-muted)' }}>Max risk for today:</span>
                   <span style={{ fontWeight: 600, color: 'var(--fg)' }} className="tabular-nums">{formatCurrency(capitalStats.maxDailyRisk)}</span>
                </div>
                {/* Progress bar for today's risk usage */}
                <div style={{ marginTop: 8 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--fg-muted)' }}>Risk Used Today</span>
                      <span style={{ color: 'var(--fg)' }} className="tabular-nums">{formatCurrency(capitalStats.todayLosses)}</span>
                   </div>
                   <div style={{ width: '100%', height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        background: capitalStats.todayLosses > capitalStats.maxDailyRisk ? 'var(--loss)' : 'var(--warning)', 
                        width: `${Math.min(100, (capitalStats.todayLosses / (capitalStats.maxDailyRisk || 1)) * 100)}%` 
                      }} />
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Total P&L"
          value={formatCurrency(stats.totalNetPnl)}
          change={stats.totalNetPnl}
          color={stats.totalNetPnl >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          icon={<Target size={20} />}
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L`}
          color={stats.winRate >= 50 ? 'profit' : 'loss'}
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          color={stats.profitFactor >= 1.5 ? 'profit' : stats.profitFactor >= 1 ? 'warning' : 'loss'}
        />
        <StatCard
          icon={<Trophy size={20} />}
          label="Best Day"
          value={stats.bestDay ? formatCurrency(stats.bestDay.pnl) : '—'}
          subtitle={stats.bestDay ? stats.bestDay.date : ''}
          color="profit"
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Current Streak"
          value={`${stats.currentStreak.count} ${stats.currentStreak.type === 'win' ? 'Wins' : 'Losses'}`}
          color={stats.currentStreak.type === 'win' ? 'profit' : 'loss'}
        />
        <StatCard
          icon={<PieChart size={20} />}
          label="Avg Win / Loss"
          value={`${formatCurrency(stats.avgWin)} / ${formatCurrency(stats.avgLoss)}`}
          color="neutral"
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Rule Adherence"
          value={`${stats.ruleAdherence.toFixed(0)}%`}
          color={stats.ruleAdherence >= 80 ? 'profit' : stats.ruleAdherence >= 50 ? 'warning' : 'loss'}
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          label="Worst Day"
          value={stats.worstDay ? formatCurrency(stats.worstDay.pnl) : '—'}
          subtitle={stats.worstDay ? stats.worstDay.date : ''}
          color="loss"
        />
      </motion.div>

      {filteredTrades.length > 0 ? (
        <>
          {/* Charts Row */}
          <motion.div variants={itemVariants} className="charts-grid" style={{ marginBottom: 24 }}>
            {/* Capital Growth Curve (New) */}
            {capitalHistory.length > 0 && (
              <div className="stat-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px 0' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                    Capital Growth Curve
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total capital over time</p>
                </div>
                <div style={{ padding: '16px 8px 8px', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={capitalHistory}>
                      <defs>
                        <linearGradient id="capitalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(val) => format(parseISO(val), 'MMM dd')} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 13,
                          color: 'var(--fg)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="capitalAfter"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#capitalGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Equity Curve */}
            <div className="stat-card" style={{ padding: 0 }}>
              <div style={{ padding: '20px 24px 0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                  Equity Curve
                </h3>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Cumulative P&L over time</p>
              </div>
              <div style={{ padding: '16px 8px 8px', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 13,
                        color: 'var(--fg)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#equityGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mistake Analysis */}
            {mistakeAnalysis.length > 0 && (
              <div className="stat-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px 0' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                    Most Costly Mistakes
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>P&L impact by mistake tag</p>
                </div>
                <div style={{ padding: '16px 8px 8px', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mistakeAnalysis} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          fontSize: 13,
                          color: 'var(--fg)',
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0), 'P&L Impact']}
                      />
                      <Bar dataKey="totalPnl" radius={[0, 6, 6, 0]}>
                        {mistakeAnalysis.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.totalPnl >= 0 ? '#22c55e' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>

          {/* Market Breakdown */}
          {marketBreakdown.length > 1 && (
            <motion.div variants={itemVariants}>
              <div className="stat-card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: 16 }}>
                  Market-wise Performance
                </h3>
                <div className="table-container" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Market</th>
                        <th>Trades</th>
                        <th>Win Rate</th>
                        <th>P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketBreakdown.map((row) => (
                        <tr key={row.market}>
                          <td style={{ fontWeight: 600 }}>{row.market}</td>
                          <td className="tabular-nums">{row.trades}</td>
                          <td className="tabular-nums">{row.winRate.toFixed(1)}%</td>
                          <td
                            className={`tabular-nums ${row.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}
                            style={{ fontWeight: 600 }}
                          >
                            {formatCurrency(row.pnl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="empty-state" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border)' }}>
            <TrendingUp size={48} />
            <h3>No trades yet</h3>
            <p>Log your first trade to see your dashboard come alive with analytics and insights.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              onClick={() => useTradingStore.getState().setActiveNav('new-trade')}
            >
              Log Your First Trade
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ---- Stat Card Component ----

function StatCard({
  icon,
  label,
  value,
  subtitle,
  change,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  change?: number;
  color: 'profit' | 'loss' | 'warning' | 'neutral';
}) {
  const colorMap = {
    profit: 'var(--profit)',
    loss: 'var(--loss)',
    warning: 'var(--warning)',
    neutral: 'var(--fg-secondary)',
  };

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ color: colorMap[color], opacity: 0.8 }}>{icon}</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-muted)' }}>{label}</span>
      </div>
      <div
        className="tabular-nums"
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: colorMap[color],
          lineHeight: 1.2,
        }}
      >
        <AnimatedValue value={value} />
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }} className="tabular-nums">
          {subtitle}
        </div>
      )}
    </div>
  );
}
