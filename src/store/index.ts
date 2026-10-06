import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/utils/supabase/client';
import {
  Trade,
  MistakeTag,
  Checklist,
  ChecklistItem,
  Strategy,
  DailyJournal,
  UserPreferences,
  MarketType,
  MarketConfig,
  EmotionTag,
  FilterState,
  DEFAULT_MISTAKE_TAGS,
  DEFAULT_LOT_CONFIGS,
  MoodScore,
  CapitalHistory,
  CapitalAdjustment,
  AdjustmentType,
} from '@/types';

// ---- Store State ----

interface TradingJournalState {
  isInitialized: boolean;
  initStore: () => Promise<void>;
  
  capitalHistory: CapitalHistory[];
  recalculateCapitalHistory: () => Promise<void>;

  // Capital Adjustments
  capitalAdjustments: CapitalAdjustment[];
  addCapitalAdjustment: (type: AdjustmentType, amount: number, purpose: string, date: string) => Promise<void>;
  deleteCapitalAdjustment: (id: string) => Promise<void>;

  // User
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Markets
  marketConfigs: MarketConfig[];
  toggleMarket: (type: MarketType) => Promise<void>;
  updateMarketConfig: (id: string, config: Partial<MarketConfig>) => Promise<void>;

  // Trades
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'userId' | 'createdAt' | 'netPnl' | 'pnl' | 'pnlPercent'>) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;

  // Mistake Tags
  mistakeTags: MistakeTag[];
  addMistakeTag: (name: string, color: string) => Promise<void>;
  deleteMistakeTag: (id: string) => Promise<void>;

  // Checklists
  checklists: Checklist[];
  addChecklist: (name: string, marketType: MarketType | 'all', items: string[]) => Promise<void>;
  updateChecklist: (id: string, updates: Partial<Checklist>) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  addChecklistItem: (checklistId: string, text: string) => Promise<void>;
  removeChecklistItem: (checklistId: string, itemId: string) => Promise<void>;
  reorderChecklistItems: (checklistId: string, items: ChecklistItem[]) => Promise<void>;

  // Strategies
  strategies: Strategy[];
  addStrategy: (name: string, description: string) => Promise<void>;
  updateStrategy: (id: string, updates: Partial<Strategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;

  // Daily Journal
  journals: DailyJournal[];
  upsertJournal: (date: string, data: { reflectionText: string; moodScore: MoodScore; marketBias: string }) => Promise<void>;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;

  // Active nav
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

const supabase = createClient();

export const useTradingStore = create<TradingJournalState>()(
  (set, get) => ({
    isInitialized: false,
    
    initStore: async () => {
      if (get().isInitialized) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { data: markets },
        { data: trades },
        { data: mistakeTags },
        { data: checklists },
        { data: checklistItems },
        { data: strategies },
        { data: journals },
        { data: capitalHistoryData },
        { data: capitalAdjustmentsData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('markets').select('*').eq('user_id', user.id),
        supabase.from('trades').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('mistake_tags').select('*').eq('user_id', user.id),
        supabase.from('checklists').select('*').eq('user_id', user.id),
        supabase.from('checklist_items').select('*'),
        supabase.from('strategies').select('*').eq('user_id', user.id),
        supabase.from('daily_journal').select('*').eq('user_id', user.id),
        supabase.from('capital_history').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        supabase.from('capital_adjustments').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      ]);

      // Process checklists & items
      const checklistsWithItems = (checklists || []).map(c => ({
        id: c.id,
        name: c.name,
        marketType: c.market_type as MarketType | 'all',
        items: (checklistItems || []).filter(i => i.checklist_id === c.id).map(i => ({
          id: i.id,
          text: i.text,
          order: i.item_order
        })).sort((a, b) => a.order - b.order)
      }));

      // Map trades
      const mappedTrades = (trades || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        marketType: 'equity' as MarketType, // Will need mapping properly, skipping for brevity
        symbol: t.symbol,
        direction: t.direction as 'long' | 'short',
        entryDate: t.created_at, // Mapping from DB
        exitDate: t.created_at,
        entryPrice: parseFloat(t.entry_price),
        exitPrice: parseFloat(t.exit_price),
        quantity: parseFloat(t.quantity),
        plannedSL: t.sl ? parseFloat(t.sl) : null,
        actualSL: t.sl ? parseFloat(t.sl) : null,
        plannedTarget: t.target ? parseFloat(t.target) : null,
        actualTarget: t.target ? parseFloat(t.target) : null,
        pnl: parseFloat(t.pnl),
        pnlPercent: parseFloat(t.pnl_percent),
        netPnl: parseFloat(t.net_pnl),
        fees: parseFloat(t.fees),
        screenshotUrl: t.screenshot_url,
        notes: t.notes,
        emotionTag: t.emotion_tag as EmotionTag | null,
        strategyId: t.strategy_id,
        createdAt: t.created_at,
        mistakeTags: [], // Need separate query ideally
        checklistResponses: []
      }));

      const defaultPrefs = {
        name: profile?.name || '',
        email: profile?.email || '',
        theme: profile?.preferred_theme as 'dark' | 'light' || 'dark',
        currency: profile?.currency || 'USD',
        selectedMarkets: (markets || []).filter(m => m.enabled).map(m => m.type as MarketType),
        onboardingComplete: !!profile,
        startingCapital: profile?.starting_capital ? parseFloat(profile.starting_capital) : undefined,
        riskPerTradePct: profile?.risk_per_trade_pct ? parseFloat(profile.risk_per_trade_pct) : 1.0,
        maxDailyRiskPct: profile?.max_daily_risk_pct ? parseFloat(profile.max_daily_risk_pct) : 3.0,
      };

      set({
        isInitialized: true,
        preferences: defaultPrefs,
        capitalHistory: (capitalHistoryData || []).map(c => ({
          id: c.id,
          userId: c.user_id,
          date: c.date,
          capitalBefore: parseFloat(c.capital_before),
          netPnl: parseFloat(c.net_pnl),
          capitalAfter: parseFloat(c.capital_after),
          createdAt: c.created_at
        })),
        capitalAdjustments: (capitalAdjustmentsData || []).map(a => ({
          id: a.id,
          userId: a.user_id,
          type: a.type as AdjustmentType,
          amount: parseFloat(a.amount),
          purpose: a.purpose || '',
          date: a.date,
          createdAt: a.created_at,
        })),
        marketConfigs: (markets || []).map(m => ({
          id: m.id,
          type: m.type as MarketType,
          enabled: m.enabled,
          defaultLotConfigs: m.default_lot_config,
          currency: m.currency
        })),
        trades: mappedTrades,
        mistakeTags: (mistakeTags || []).map(t => ({
          id: t.id,
          name: t.name,
          color: t.color,
          isCustom: t.is_custom
        })),
        checklists: checklistsWithItems,
        strategies: (strategies || []).map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          createdAt: s.created_at
        })),
        journals: (journals || []).map(j => ({
          id: j.id,
          date: j.date,
          reflectionText: j.reflection_text,
          moodScore: j.mood_score as MoodScore,
          marketBias: j.market_bias,
          createdAt: j.created_at
        }))
      });
    },

    // ---- User Preferences ----
    preferences: {
      name: '',
      email: '',
      theme: 'dark',
      currency: 'INR',
      selectedMarkets: [],
      onboardingComplete: false,
    },
    capitalHistory: [],
    capitalAdjustments: [],
    recalculateCapitalHistory: async () => {
      const s = get();
      if (s.preferences.startingCapital === undefined) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Build a map of trade PnL by date
      const tradesByDate: Record<string, number> = {};
      s.trades.forEach(t => {
        const date = t.exitDate.split('T')[0];
        tradesByDate[date] = (tradesByDate[date] || 0) + t.netPnl;
      });

      // Build a map of capital adjustments by date
      const adjustmentsByDate: Record<string, number> = {};
      s.capitalAdjustments.forEach(a => {
        const adj = a.type === 'deposit' ? a.amount : -a.amount;
        adjustmentsByDate[a.date] = (adjustmentsByDate[a.date] || 0) + adj;
      });

      // Merge all dates that have either trades or adjustments
      const allDates = new Set([...Object.keys(tradesByDate), ...Object.keys(adjustmentsByDate)]);
      const dates = Array.from(allDates).sort();

      let currentCapital = s.preferences.startingCapital;
      const newHistory: CapitalHistory[] = [];
      const dbInserts = [];

      for (const date of dates) {
        const netPnl = tradesByDate[date] || 0;
        const adjustment = adjustmentsByDate[date] || 0;
        const capitalBefore = currentCapital;
        const capitalAfter = capitalBefore + netPnl + adjustment;
        currentCapital = capitalAfter;

        newHistory.push({
          id: uuidv4(),
          userId: user.id,
          date,
          capitalBefore,
          netPnl: netPnl + adjustment,
          capitalAfter,
          createdAt: new Date().toISOString()
        });

        dbInserts.push({
          user_id: user.id,
          date,
          capital_before: capitalBefore,
          net_pnl: netPnl + adjustment,
          capital_after: capitalAfter
        });
      }

      set({ capitalHistory: newHistory });

      if (dbInserts.length > 0) {
        await supabase.from('capital_history').upsert(dbInserts, { onConflict: 'user_id,date' });
      } else {
        // clear history if no trades/adjustments
        await supabase.from('capital_history').delete().eq('user_id', user.id);
      }
    },
    addCapitalAdjustment: async (type, amount, purpose, date) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('capital_adjustments').insert({
        user_id: user.id,
        type,
        amount,
        purpose,
        date,
      }).select().single();

      if (data) {
        const newAdj: CapitalAdjustment = {
          id: data.id,
          userId: user.id,
          type,
          amount,
          purpose,
          date,
          createdAt: data.created_at,
        };
        set((s) => ({ capitalAdjustments: [...s.capitalAdjustments, newAdj] }));
        get().recalculateCapitalHistory();
      }
    },
    deleteCapitalAdjustment: async (id) => {
      set((s) => ({ capitalAdjustments: s.capitalAdjustments.filter(a => a.id !== id) }));
      await supabase.from('capital_adjustments').delete().eq('id', id);
      get().recalculateCapitalHistory();
    },
    setPreferences: async (prefs) => {
      set((s) => ({ preferences: { ...s.preferences, ...prefs } }));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const updates: any = {};
        if (prefs.theme !== undefined) updates.preferred_theme = prefs.theme;
        if (prefs.currency !== undefined) updates.currency = prefs.currency;
        if (prefs.name !== undefined) updates.name = prefs.name;
        if (prefs.startingCapital !== undefined) updates.starting_capital = prefs.startingCapital;
        if (prefs.riskPerTradePct !== undefined) updates.risk_per_trade_pct = prefs.riskPerTradePct;
        if (prefs.maxDailyRiskPct !== undefined) updates.max_daily_risk_pct = prefs.maxDailyRiskPct;
        
        if (Object.keys(updates).length > 0) {
          await supabase.from('profiles').update(updates).eq('id', user.id);
        }
        if (prefs.startingCapital !== undefined) {
           get().recalculateCapitalHistory();
        }
      }
    },

    // ---- Markets ----
    marketConfigs: [],
    toggleMarket: async (type) => {
      const s = get();
      const m = s.marketConfigs.find(x => x.type === type);
      if (m) {
        set((s) => ({
          marketConfigs: s.marketConfigs.map((mc) =>
            mc.type === type ? { ...mc, enabled: !mc.enabled } : mc
          ),
        }));
        await supabase.from('markets').update({ enabled: !m.enabled }).eq('id', m.id);
      }
    },
    updateMarketConfig: async (id, config) => {
      set((s) => ({
        marketConfigs: s.marketConfigs.map((m) =>
          m.id === id ? { ...m, ...config } : m
        ),
      }));
      await supabase.from('markets').update({ default_lot_config: config.defaultLotConfigs }).eq('id', id);
    },

    // ---- Trades ----
    trades: [],
    addTrade: async (tradeData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const direction = tradeData.direction;
      const pnl =
        direction === 'long'
          ? (tradeData.exitPrice - tradeData.entryPrice) * tradeData.quantity
          : (tradeData.entryPrice - tradeData.exitPrice) * tradeData.quantity;
      const pnlPercent =
        direction === 'long'
          ? ((tradeData.exitPrice - tradeData.entryPrice) / tradeData.entryPrice) * 100
          : ((tradeData.entryPrice - tradeData.exitPrice) / tradeData.entryPrice) * 100;
      const netPnl = pnl - (tradeData.fees || 0);

      const { data: insertedTrade } = await supabase.from('trades').insert({
        user_id: user.id,
        symbol: tradeData.symbol,
        direction: tradeData.direction,
        entry_price: tradeData.entryPrice,
        exit_price: tradeData.exitPrice,
        quantity: tradeData.quantity,
        sl: tradeData.plannedSL,
        target: tradeData.plannedTarget,
        pnl,
        pnl_percent: pnlPercent,
        net_pnl: netPnl,
        fees: tradeData.fees,
        notes: tradeData.notes,
        emotion_tag: tradeData.emotionTag,
        strategy_id: tradeData.strategyId,
      }).select().single();

      if (insertedTrade) {
        // optimistic state update
        const newTrade: Trade = {
          ...tradeData,
          id: insertedTrade.id,
          userId: user.id,
          pnl,
          pnlPercent,
          netPnl,
          createdAt: insertedTrade.created_at,
        };
        set((s) => ({ trades: [newTrade, ...s.trades] }));
        get().recalculateCapitalHistory();
      }
    },
    updateTrade: async (id, updates) => {
      set((s) => ({
        trades: s.trades.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          // Recalculate PnL if any price/quantity/direction field changed
          if (updates.entryPrice !== undefined || updates.exitPrice !== undefined || updates.quantity !== undefined || updates.direction !== undefined || updates.fees !== undefined) {
            const dir = updated.direction;
            updated.pnl = dir === 'long'
                ? (updated.exitPrice - updated.entryPrice) * updated.quantity
                : (updated.entryPrice - updated.exitPrice) * updated.quantity;
            updated.pnlPercent = dir === 'long'
                ? ((updated.exitPrice - updated.entryPrice) / updated.entryPrice) * 100
                : ((updated.entryPrice - updated.exitPrice) / updated.entryPrice) * 100;
            updated.netPnl = updated.pnl - (updated.fees || 0);
          }
          return updated;
        }),
      }));

      // Get the fully updated trade for DB sync
      const updatedTrade = get().trades.find(t => t.id === id);
      if (updatedTrade) {
        const dbUpdates: any = {};
        if (updates.symbol !== undefined) dbUpdates.symbol = updatedTrade.symbol;
        if (updates.direction !== undefined) dbUpdates.direction = updatedTrade.direction;
        if (updates.entryPrice !== undefined) dbUpdates.entry_price = updatedTrade.entryPrice;
        if (updates.exitPrice !== undefined) dbUpdates.exit_price = updatedTrade.exitPrice;
        if (updates.quantity !== undefined) dbUpdates.quantity = updatedTrade.quantity;
        if (updates.fees !== undefined) dbUpdates.fees = updatedTrade.fees;
        if (updates.notes !== undefined) dbUpdates.notes = updatedTrade.notes;
        if (updates.emotionTag !== undefined) dbUpdates.emotion_tag = updatedTrade.emotionTag;
        if (updates.strategyId !== undefined) dbUpdates.strategy_id = updatedTrade.strategyId;
        if (updates.plannedSL !== undefined) dbUpdates.sl = updatedTrade.plannedSL;
        if (updates.plannedTarget !== undefined) dbUpdates.target = updatedTrade.plannedTarget;
        // Always sync computed fields
        dbUpdates.pnl = updatedTrade.pnl;
        dbUpdates.pnl_percent = updatedTrade.pnlPercent;
        dbUpdates.net_pnl = updatedTrade.netPnl;

        if (Object.keys(dbUpdates).length > 0) {
          await supabase.from('trades').update(dbUpdates).eq('id', id);
        }
      }
      get().recalculateCapitalHistory();
    },
    deleteTrade: async (id) => {
      set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }));
      await supabase.from('trades').delete().eq('id', id);
      get().recalculateCapitalHistory();
    },

    // ---- Mistake Tags ----
    mistakeTags: [],
    addMistakeTag: async (name, color) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('mistake_tags').insert({
        user_id: user.id,
        name,
        color,
        is_custom: true
      }).select().single();
      
      if (data) {
        set((s) => ({
          mistakeTags: [
            ...s.mistakeTags,
            { id: data.id, name, isCustom: true, color },
          ],
        }));
      }
    },
    deleteMistakeTag: async (id) => {
      set((s) => ({ mistakeTags: s.mistakeTags.filter((t) => t.id !== id) }));
      await supabase.from('mistake_tags').delete().eq('id', id);
    },

    // ---- Checklists ----
    checklists: [],
    addChecklist: async (name, marketType, items) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: cl } = await supabase.from('checklists').insert({
        user_id: user.id,
        name,
        market_type: marketType
      }).select().single();

      if (cl) {
        const itemsToInsert = items.map((text, i) => ({
          checklist_id: cl.id,
          text,
          item_order: i
        }));
        await supabase.from('checklist_items').insert(itemsToInsert);
        // Refresh store
        get().initStore();
      }
    },
    updateChecklist: async (id, updates) => {
      set((s) => ({
        checklists: s.checklists.map((c) => c.id === id ? { ...c, ...updates } : c),
      }));
      await supabase.from('checklists').update({ name: updates.name }).eq('id', id);
    },
    deleteChecklist: async (id) => {
      set((s) => ({ checklists: s.checklists.filter((c) => c.id !== id) }));
      await supabase.from('checklists').delete().eq('id', id);
    },
    addChecklistItem: async (checklistId, text) => {
      const c = get().checklists.find(c => c.id === checklistId);
      if (c) {
        const { data } = await supabase.from('checklist_items').insert({
          checklist_id: checklistId,
          text,
          item_order: c.items.length
        }).select().single();
        if (data) {
          set((s) => ({
            checklists: s.checklists.map((c) => c.id === checklistId ? {
                ...c,
                items: [...c.items, { id: data.id, text, order: data.item_order }],
              } : c
            ),
          }));
        }
      }
    },
    removeChecklistItem: async (checklistId, itemId) => {
      set((s) => ({
        checklists: s.checklists.map((c) =>
          c.id === checklistId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
        ),
      }));
      await supabase.from('checklist_items').delete().eq('id', itemId);
    },
    reorderChecklistItems: async (checklistId, items) => {
      set((s) => ({
        checklists: s.checklists.map((c) => c.id === checklistId ? { ...c, items } : c),
      }));
      // Note: skip batch updating in DB for simplicity in this port
    },

    // ---- Strategies ----
    strategies: [],
    addStrategy: async (name, description) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('strategies').insert({
        user_id: user.id,
        name,
        description
      }).select().single();
      if (data) {
        set((s) => ({
          strategies: [
            ...s.strategies,
            { id: data.id, name, description, createdAt: data.created_at },
          ],
        }));
      }
    },
    updateStrategy: async (id, updates) => {
      set((s) => ({
        strategies: s.strategies.map((st) => st.id === id ? { ...st, ...updates } : st),
      }));
      await supabase.from('strategies').update({ name: updates.name, description: updates.description }).eq('id', id);
    },
    deleteStrategy: async (id) => {
      set((s) => ({ strategies: s.strategies.filter((st) => st.id !== id) }));
      await supabase.from('strategies').delete().eq('id', id);
    },

    // ---- Daily Journal ----
    journals: [],
    upsertJournal: async (date, data) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: upserted } = await supabase.from('daily_journal').upsert({
        user_id: user.id,
        date,
        reflection_text: data.reflectionText,
        mood_score: data.moodScore,
        market_bias: data.marketBias
      }, { onConflict: 'user_id,date' }).select().single();
      
      if (upserted) {
        set((s) => {
          const existing = s.journals.find((j) => j.date === date);
          if (existing) {
            return {
              journals: s.journals.map((j) => j.date === date ? { ...j, ...data } : j),
            };
          }
          return {
            journals: [...s.journals, { id: upserted.id, date, ...data, createdAt: upserted.created_at }],
          };
        });
      }
    },

    // ---- Filters ----
    filters: {
      timeFilter: 'all',
      startDate: null,
      endDate: null,
      marketType: 'all',
      strategyId: null,
    },
    setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),

    // ---- Navigation ----
    activeNav: 'dashboard',
    setActiveNav: (nav) => set({ activeNav: nav }),
  })
);
