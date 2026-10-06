import React, { useState } from 'react';
import { BookOpen, Plus, Tag, TrendingUp, TrendingDown, Clock, Search, Trash2 } from 'lucide-react';
import { useGetJournalEntriesQuery, useAddJournalEntryMutation, useDeleteJournalEntryMutation, useGetForexRatesQuery } from '../store/api';

interface JournalEntry {
  _id?: string;
  id?: string;
  date: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  currency: 'INR' | 'USD';
  multiplier: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  setup: string;
  emotion: string;
  notes: string;
}

// Temporary local state for Journal until backend is integrated
export default function JournalPage() {
  const { data: journalData } = useGetJournalEntriesQuery();
  const [addJournalEntry] = useAddJournalEntryMutation();
  const [deleteJournalEntry] = useDeleteJournalEntryMutation();
  const { data: forexData } = useGetForexRatesQuery('USD/INR');
  
  const entries: JournalEntry[] = journalData?.data || [];
  const inrRateObj = forexData?.data?.find(f => f.pair === 'USD/INR');
  const inrRate = inrRateObj ? inrRateObj.rate : 84;

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    symbol: '',
    type: 'LONG' as 'LONG' | 'SHORT',
    currency: 'INR' as 'INR' | 'USD',
    multiplier: '1',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    setup: 'Breakout',
    emotion: 'Neutral',
    notes: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const entryPrice = Number(form.entryPrice);
    const exitPrice = Number(form.exitPrice);
    const qty = Number(form.quantity);
    const mult = Number(form.multiplier);
    
    // Calculate P&L
    const rawDiff = form.type === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const pnl = rawDiff * qty * mult;

    const newEntry = {
      symbol: form.symbol.toUpperCase(),
      type: form.type,
      currency: form.currency,
      multiplier: mult,
      entryPrice,
      exitPrice,
      quantity: qty,
      pnl,
      setup: form.setup,
      emotion: form.emotion,
      notes: form.notes
    };

    await addJournalEntry(newEntry).unwrap();
    setShowForm(false);
    setForm({
      symbol: '', type: 'LONG', currency: 'INR', multiplier: '1', entryPrice: '', exitPrice: '', quantity: '', setup: 'Breakout', emotion: 'Neutral', notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this journal entry?')) {
      await deleteJournalEntry(id).unwrap();
    }
  };

  // Convert total to INR
  const totalPnL = entries.reduce((acc, curr) => {
    const val = curr.currency === 'USD' ? curr.pnl * inrRate : curr.pnl;
    return acc + val;
  }, 0);
  const winRate = entries.length ? (entries.filter(e => e.pnl > 0).length / entries.length) * 100 : 0;
  const filteredEntries = entries.filter(e => e.symbol.includes(searchTerm.toUpperCase()));
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-dash-text-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            Trading Journal
          </h1>
          <p className="text-dash-text-secondary text-[14px]">Document your trades, mindsets, and strategies.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 text-[14px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log New Trade
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dash-card p-5 rounded-xl border border-dash-border shadow-sm">
          <h3 className="text-dash-text-secondary text-[13px] mb-1">Total Net P&L</h3>
          <p className={`text-[24px] font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-dash-card p-5 rounded-xl border border-dash-border shadow-sm">
          <h3 className="text-dash-text-secondary text-[13px] mb-1">Win Rate</h3>
          <p className="text-[24px] font-bold text-dash-text-primary">{winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-dash-card p-5 rounded-xl border border-dash-border shadow-sm">
          <h3 className="text-dash-text-secondary text-[13px] mb-1">Total Trades</h3>
          <p className="text-[24px] font-bold text-dash-text-primary">{entries.length}</p>
        </div>
      </div>

      {/* New Trade Form */}
      {showForm && (
        <div className="bg-dash-elevated p-6 rounded-xl border border-dash-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-[16px] font-semibold text-dash-text-primary mb-4 border-b border-dash-border pb-3">New Trade Entry</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Symbol</label>
              <input type="text" required placeholder="e.g. RELIANCE" className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase text-[14px]" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} />
            </div>

            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Direction</label>
              <select className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Quantity</label>
              <input type="number" required placeholder="0" className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>


            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Currency</label>
              <select className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.currency} onChange={e => setForm({...form, currency: e.target.value as any})}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Multiplier (Lot size/units)</label>
              <input type="number" required placeholder="1" className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.multiplier} onChange={e => setForm({...form, multiplier: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Entry Price ({form.currency === 'USD' ? '$' : '₹'})</label>

              <input type="number" required step="any" placeholder="0.00" className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})} />
            </div>

            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Exit Price ({form.currency === 'USD' ? '$' : '₹'})</label>
              <input type="number" required step="any" placeholder="0.00" className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.exitPrice} onChange={e => setForm({...form, exitPrice: e.target.value})} />
            </div>

            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Setup / Strategy</label>
              <select className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.setup} onChange={e => setForm({...form, setup: e.target.value})}>
                <option>Breakout</option>
                <option>Pullback</option>
                <option>Reversal</option>
                <option>News Catalyst</option>
                <option>Scalp</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Mindset / Emotion</label>
              <select className="w-full h-10 px-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px]" value={form.emotion} onChange={e => setForm({...form, emotion: e.target.value})}>
                <option>Neutral / Focused</option>
                <option>Confident</option>
                <option>FOMO (Fear of Missing Out)</option>
                <option>Revenge Trading</option>
                <option>Hesitant / Anxious</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-[12px] text-dash-text-muted mb-1 ml-1">Trade Notes & Learnings</label>
              <textarea placeholder="Why did you take this trade? What did you do well? What could be improved?" className="w-full p-3 bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:ring-1 focus:ring-blue-500 outline-none text-[14px] min-h-[100px] resize-y" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}></textarea>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg text-dash-text-secondary hover:bg-dash-card transition-colors text-[14px] font-medium">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-[14px] font-medium">Save Trade</button>
            </div>
          </form>
        </div>
      )}

      {/* Journal History */}
      <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-dash-border bg-dash-header/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-[16px] font-semibold text-dash-text-primary">Trade History</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-text-muted" />
            <input 
              type="text" 
              placeholder="Filter by symbol..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-dash-bg border border-dash-border rounded-md text-dash-text-primary text-[13px] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-0">
          {entries.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center">
              <BookOpen className="w-12 h-12 text-dash-text-muted mb-4 opacity-50" />
              <p className="text-dash-text-primary font-medium mb-1">Your journal is empty</p>
              <p className="text-dash-text-secondary text-[14px]">Log your first trade to start tracking your performance.</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-dash-text-muted text-[14px]">No trades match your search.</div>
          ) : (
            <div className="divide-y divide-dash-border">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="p-6 hover:bg-dash-elevated transition-colors">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    
                    {/* Left: Trade Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${entry.type === 'LONG' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {entry.type}
                        </span>
                        <span className="font-bold text-[16px] text-dash-text-primary">{entry.symbol}</span>
                        <span className="text-[12px] text-dash-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3 mb-4 text-[13px]">
                        <div><span className="text-dash-text-muted">Entry:</span> <span className="text-dash-text-primary font-medium">{entry.currency === 'USD' ? '$' : '₹'}{entry.entryPrice}</span></div>
                        <div><span className="text-dash-text-muted">Exit:</span> <span className="text-dash-text-primary font-medium">{entry.currency === 'USD' ? '$' : '₹'}{entry.exitPrice}</span></div>
                        <div><span className="text-dash-text-muted">Qty:</span> <span className="text-dash-text-primary font-medium">{entry.quantity}</span></div>
                        <div><span className="text-dash-text-muted">Setup:</span> <span className="text-dash-text-primary font-medium">{entry.setup}</span></div>
                        <div className="flex items-center gap-1"><span className="text-dash-text-muted">Emotion:</span> <span className="text-dash-text-primary font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> {entry.emotion}</span></div>
                      </div>

                      {entry.notes && (
                        <div className="bg-dash-bg p-3 rounded-lg border border-dash-border/50 text-[13px] text-dash-text-secondary leading-relaxed">
                          "{entry.notes}"
                        </div>
                      )}
                    </div>

                    {/* Right: P&L */}
                                        <div className="flex flex-col items-end justify-start min-w-[120px]">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[12px] text-dash-text-muted">Net P&L</span>
                        <button onClick={() => handleDelete(entry._id || entry.id!)} className="text-red-500/70 hover:text-red-500 transition-colors p-1" title="Delete">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className={`text-[20px] font-bold flex items-center gap-1 ${entry.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.pnl >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        {entry.pnl >= 0 ? '+' : '-'}{entry.currency === 'USD' ? '$' : '₹'}{Math.abs(entry.pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {entry.currency === 'USD' && (
                        <span className="text-[11px] text-dash-text-muted mt-1">
                          ~₹{(Math.abs(entry.pnl) * inrRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
