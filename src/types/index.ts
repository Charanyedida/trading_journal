// ==========================================
// Trading Journal — Core Type Definitions
// ==========================================

export type MarketType = 'equity' | 'fno' | 'forex' | 'crypto' | 'gold';

export type TradeDirection = 'long' | 'short';

export type EmotionTag =
  | 'calm'
  | 'confident'
  | 'anxious'
  | 'greedy'
  | 'fearful'
  | 'revenge';

export type MoodScore = 1 | 2 | 3 | 4 | 5;

// ---- Market Configuration ----

export interface LotConfig {
  symbol: string;
  lotSize: number;
}

export interface MarketConfig {
  id: string;
  type: MarketType;
  enabled: boolean;
  defaultLotConfigs: LotConfig[];
  currency: string;
}

// ---- Trade ----

export interface Trade {
  id: string;
  userId: string;
  marketType: MarketType;
  symbol: string;
  direction: TradeDirection;
  entryDate: string; // ISO
  exitDate: string; // ISO
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  plannedSL: number | null;
  actualSL: number | null;
  plannedTarget: number | null;
  actualTarget: number | null;
  pnl: number;
  pnlPercent: number;
  fees: number;
  netPnl: number;
  screenshotUrl: string | null;
  notes: string;
  emotionTag: EmotionTag | null;
  strategyId: string | null;
  mistakeTags: string[];
  checklistResponses: ChecklistResponse[];
  createdAt: string;
}

// ---- Mistake Tags ----

export interface MistakeTag {
  id: string;
  name: string;
  isCustom: boolean;
  color: string;
}

// ---- Checklist / Rules ----

export interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

export interface Checklist {
  id: string;
  marketType: MarketType | 'all';
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistResponse {
  checklistItemId: string;
  checked: boolean;
}

// ---- Strategy ----

export interface Strategy {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

// ---- Daily Journal ----

export interface DailyJournal {
  id: string;
  date: string; // YYYY-MM-DD
  reflectionText: string;
  moodScore: MoodScore;
  marketBias: string;
  createdAt: string;
}

// ---- User Preferences ----

export interface UserPreferences {
  name: string;
  email: string;
  theme: 'dark' | 'light';
  currency: string;
  selectedMarkets: MarketType[];
  onboardingComplete: boolean;
}

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalPnl: number;
  totalNetPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  currentStreak: { type: 'win' | 'loss'; count: number };
  ruleAdherence: number;
}

// ---- Calendar Day ----

export interface CalendarDay {
  date: string;
  pnl: number;
  tradeCount: number;
  journal: DailyJournal | null;
}

// ---- Filter State ----

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all' | 'custom';

export interface FilterState {
  timeFilter: TimeFilter;
  startDate: string | null;
  endDate: string | null;
  marketType: MarketType | 'all';
  strategyId: string | null;
}

// ---- Market Display Names ----

export const MARKET_LABELS: Record<MarketType, string> = {
  equity: 'Indian Equity',
  fno: 'F&O',
  forex: 'Forex',
  crypto: 'Crypto',
  gold: 'Gold / MCX',
};

export const MARKET_ICONS: Record<MarketType, string> = {
  equity: '📈',
  fno: '📊',
  forex: '💱',
  crypto: '₿',
  gold: '🥇',
};

export const EMOTION_LABELS: Record<EmotionTag, { label: string; emoji: string; color: string }> = {
  calm: { label: 'Calm', emoji: '😌', color: '#22c55e' },
  confident: { label: 'Confident', emoji: '💪', color: '#3b82f6' },
  anxious: { label: 'Anxious', emoji: '😰', color: '#f59e0b' },
  greedy: { label: 'Greedy', emoji: '🤑', color: '#ef4444' },
  fearful: { label: 'Fearful', emoji: '😨', color: '#8b5cf6' },
  revenge: { label: 'Revenge', emoji: '😤', color: '#dc2626' },
};

export const DEFAULT_MISTAKE_TAGS: Omit<MistakeTag, 'id'>[] = [
  { name: 'FOMO', isCustom: false, color: '#ef4444' },
  { name: 'Overtrading', isCustom: false, color: '#f97316' },
  { name: 'Revenge Trading', isCustom: false, color: '#dc2626' },
  { name: 'No Stop-Loss', isCustom: false, color: '#b91c1c' },
  { name: 'Moved SL', isCustom: false, color: '#f59e0b' },
  { name: 'Oversized Position', isCustom: false, color: '#d97706' },
  { name: 'Ignored Setup', isCustom: false, color: '#8b5cf6' },
  { name: 'Chased Entry', isCustom: false, color: '#6366f1' },
  { name: 'Early Exit', isCustom: false, color: '#0ea5e9' },
  { name: 'Late Exit', isCustom: false, color: '#06b6d4' },
  { name: 'News Trading Impulse', isCustom: false, color: '#ec4899' },
];

export const DEFAULT_CHECKLIST_ITEMS: string[] = [
  'Did I wait for confirmation candle?',
  'Is this within my risk per trade (1-2%)?',
  'Am I trading my plan, not my emotions?',
  'Have I checked the news/economic calendar today?',
  'Is the risk-reward ratio at least 1:2?',
  'Have I identified support/resistance levels?',
  'Is the overall market trend in my favor?',
  'Am I within my daily loss limit?',
];

export const DEFAULT_LOT_CONFIGS: Record<MarketType, LotConfig[]> = {
  equity: [
    { symbol: 'Default', lotSize: 1 },
  ],
  fno: [
    { symbol: 'NIFTY', lotSize: 25 },
    { symbol: 'BANKNIFTY', lotSize: 15 },
    { symbol: 'FINNIFTY', lotSize: 25 },
    { symbol: 'MIDCPNIFTY', lotSize: 50 },
  ],
  forex: [
    { symbol: 'Standard Lot', lotSize: 100000 },
    { symbol: 'Mini Lot', lotSize: 10000 },
    { symbol: 'Micro Lot', lotSize: 1000 },
  ],
  crypto: [
    { symbol: 'BTC', lotSize: 1 },
    { symbol: 'ETH', lotSize: 1 },
  ],
  gold: [
    { symbol: 'Gold (100g)', lotSize: 100 },
    { symbol: 'Gold (1kg)', lotSize: 1000 },
    { symbol: 'Silver (30kg)', lotSize: 30 },
  ],
};
