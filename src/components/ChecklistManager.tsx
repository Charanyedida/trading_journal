'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradingStore } from '@/store';
import { Checklist, MarketType, MARKET_LABELS } from '@/types';
import { Plus, Trash2, GripVertical, CheckSquare, Save, X } from 'lucide-react';

export function ChecklistManager() {
  const { checklists, addChecklist, updateChecklist, deleteChecklist, addChecklistItem, removeChecklistItem } = useTradingStore();
  const [activeChecklistId, setActiveChecklistId] = useState<string>(checklists[0]?.id || '');
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistMarket, setNewChecklistMarket] = useState<MarketType | 'all'>('all');

  const [newItemText, setNewItemText] = useState('');

  const activeChecklist = checklists.find(c => c.id === activeChecklistId);

  const handleCreateChecklist = () => {
    if (!newChecklistName.trim()) return;
    addChecklist(newChecklistName, newChecklistMarket, []);
    setNewChecklistName('');
    setIsAddingNew(false);
    // Note: We'd ideally want to select the newly created one, but we don't have its ID immediately returned.
    // In a real scenario, we'd grab the ID or use a slightly different flow.
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !activeChecklistId) return;
    addChecklistItem(activeChecklistId, newItemText);
    setNewItemText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>
          Checklists & Rules
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>
          Manage your pre-trade discipline rules across different markets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Sidebar: List of Checklists */}
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>Your Checklists</h3>
            <button 
              className="btn-icon btn-ghost" 
              onClick={() => setIsAddingNew(true)}
              title="New Checklist"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {checklists.map(cl => (
              <button
                key={cl.id}
                onClick={() => setActiveChecklistId(cl.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: activeChecklistId === cl.id ? 'var(--accent-glow)' : 'transparent',
                  color: activeChecklistId === cl.id ? 'var(--accent-hover)' : 'var(--fg)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={16} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                    {cl.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area: Active Checklist Editor */}
        <div className="stat-card" style={{ minHeight: 400 }}>
          {isAddingNew ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Create New Checklist</h2>
              
              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Checklist Name</label>
                <input 
                  className="input" 
                  placeholder="e.g. Forex Scalping Rules" 
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="input-label">Applicable Market</label>
                <select 
                  className="select"
                  value={newChecklistMarket}
                  onChange={(e) => setNewChecklistMarket(e.target.value as MarketType | 'all')}
                >
                  <option value="all">All Markets</option>
                  {(Object.keys(MARKET_LABELS) as MarketType[]).map(key => (
                    <option key={key} value={key}>{MARKET_LABELS[key]}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={handleCreateChecklist}>
                  <Save size={16} /> Save Checklist
                </button>
                <button className="btn btn-secondary" onClick={() => setIsAddingNew(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : activeChecklist ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={activeChecklist.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>
                    {activeChecklist.name}
                  </h2>
                  <div className="badge badge-neutral">
                    {activeChecklist.marketType === 'all' ? 'All Markets' : MARKET_LABELS[activeChecklist.marketType as MarketType]}
                  </div>
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (window.confirm('Delete this checklist completely?')) {
                      deleteChecklist(activeChecklist.id);
                      setActiveChecklistId(checklists[0]?.id || '');
                    }
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Rules & Checklist Items ({activeChecklist.items.length})
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence>
                    {activeChecklist.items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12, 
                          background: 'var(--bg-secondary)', 
                          padding: '12px 16px', 
                          borderRadius: 'var(--radius-md)' 
                        }}
                      >
                        <GripVertical size={16} style={{ color: 'var(--fg-muted)', cursor: 'grab' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-muted)', width: 20 }}>
                          {i + 1}.
                        </span>
                        <div style={{ flex: 1, fontSize: 14, color: 'var(--fg)' }}>
                          {item.text}
                        </div>
                        <button 
                          className="btn-icon btn-ghost" 
                          onClick={() => removeChecklistItem(activeChecklist.id, item.id)}
                        >
                          <X size={16} style={{ color: 'var(--loss)' }} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <input
                  className="input"
                  placeholder="Add a new rule (e.g. Is risk reward 1:2?)"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!newItemText.trim()}>
                  <Plus size={16} /> Add Rule
                </button>
              </form>

            </motion.div>
          ) : (
            <div className="empty-state" style={{ height: '100%', padding: 0 }}>
              <CheckSquare size={48} />
              <h3>No Checklist Selected</h3>
              <p>Select a checklist from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 260px 1fr"] {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
