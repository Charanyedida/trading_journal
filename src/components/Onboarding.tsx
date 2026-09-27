'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingStore } from '@/store';
import { MarketType, MARKET_LABELS, MARKET_ICONS } from '@/types';
import { TrendingUp, ArrowRight, Check, Sparkles } from 'lucide-react';

export function Onboarding() {
  const { setPreferences, toggleMarket, marketConfigs } = useTradingStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const selectedMarkets = marketConfigs.filter((m) => m.enabled).map((m) => m.type);

  const handleFinish = () => {
    setPreferences({
      name,
      onboardingComplete: true,
      selectedMarkets,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          top: -100,
          right: -100,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          bottom: -100,
          left: -100,
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: 520,
              textAlign: 'center',
            }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 28px',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.3)',
              }}
            >
              <TrendingUp size={40} color="#fff" />
            </motion.div>

            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: 'var(--fg)' }}>
              Welcome to TradeLog
            </h1>
            <p style={{ fontSize: 16, color: 'var(--fg-secondary)', lineHeight: 1.6, marginBottom: 36 }}>
              Your personal trading journal for building discipline, tracking psychology, and improving performance across all markets.
            </p>

            <div style={{ marginBottom: 28 }}>
              <label className="input-label" style={{ textAlign: 'left' }}>
                What&apos;s your name?
              </label>
              <input
                className="input"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: 16, padding: '14px 18px' }}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              style={{ width: '100%' }}
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="markets"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: 560, width: '100%' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--fg)' }}>
                What do you trade?
              </h2>
              <p style={{ fontSize: 15, color: 'var(--fg-secondary)' }}>
                Select one or more markets. You can change this later.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {(['equity', 'fno', 'forex', 'crypto', 'gold'] as MarketType[]).map((type) => {
                const isSelected = selectedMarkets.includes(type);
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleMarket(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '18px 24px',
                      borderRadius: 'var(--radius-xl)',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-glow)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%',
                      fontFamily: 'inherit',
                      color: 'var(--fg)',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{MARKET_ICONS[type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{MARKET_LABELS[type]}</div>
                      <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
                        {type === 'equity' && 'NSE/BSE Cash & Delivery'}
                        {type === 'fno' && 'Futures & Options — NIFTY, BANKNIFTY'}
                        {type === 'forex' && 'Currency pairs — EUR/USD, GBP/JPY'}
                        {type === 'crypto' && 'BTC, ETH, Altcoins — USDT/INR pairs'}
                        {type === 'gold' && 'MCX Gold, Silver, Commodities'}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={14} color="#fff" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setStep(0)}
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleFinish}
                disabled={selectedMarkets.length === 0}
                style={{ flex: 2 }}
              >
                <Sparkles size={18} />
                Start Journaling
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
