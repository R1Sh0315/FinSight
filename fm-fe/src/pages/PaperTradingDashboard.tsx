import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetPaperTradesQuery, useCreatePaperTradeMutation } from '../store/api';
import { Plus, Clock, X } from 'lucide-react';

export default function PaperTradingDashboard() {
  const { data: tradesData, isLoading } = useGetPaperTradesQuery();
  const [createTrade, { isLoading: isCreating }] = useCreatePaperTradeMutation();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    underlying: '',
    optionType: 'CE',
    strikePrice: '',
    expiryDate: '',
    entryPrice: '',
    lotSize: '',
    numberOfLots: '1',
    notes: ''
  });

  const trades = tradesData?.data || [];
  
  const activeTrades = trades.filter(t => t.status === 'ACTIVE');
  const exitedTrades = trades.filter(t => t.status === 'EXITED');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrade({
        underlying: formData.underlying,
        optionType: formData.optionType,
        strikePrice: Number(formData.strikePrice),
        expiryDate: formData.expiryDate,
        entryPrice: Number(formData.entryPrice),
        lotSize: Number(formData.lotSize),
        numberOfLots: Number(formData.numberOfLots),
        notes: formData.notes
      }).unwrap();
      setIsAddModalOpen(false);
      // Reset form
      setFormData({
        underlying: '', optionType: 'CE', strikePrice: '', expiryDate: '',
        entryPrice: '', lotSize: '', numberOfLots: '1', notes: ''
      });
    } catch (err) {
      console.error('Failed to create paper trade:', err);
      alert('Failed to add trade. Please check inputs.');
    }
  };

  const renderTradeRow = (trade: any) => {
    const isCE = trade.optionType === 'CE';
    const isExited = trade.status === 'EXITED';
    
    // Calculate PnL (for active trades, we need current price, but for MVP we use the last recorded price in history)
    const currentPrice = isExited ? trade.exitPrice : (trade.priceHistory.length > 0 ? trade.priceHistory[trade.priceHistory.length - 1].price : trade.entryPrice);
    
    const pnl = (currentPrice - trade.entryPrice) * trade.totalQuantity;
    const pnlPercent = trade.entryPrice > 0 ? (pnl / (trade.entryPrice * trade.totalQuantity)) * 100 : 0;
    
    return (
      <tr key={trade._id} className="border-b border-dash-border hover:bg-dash-elevated/50 transition-colors">
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${isCE ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {trade.optionType}
            </span>
            <div>
              <p className="font-semibold text-dash-text-primary">{trade.underlying}</p>
              <p className="text-[12px] text-dash-text-secondary">{trade.strikePrice} Strike</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-right text-dash-text-primary font-medium">₹{trade.entryPrice.toFixed(2)}</td>
        <td className="py-4 px-4 text-right text-dash-text-primary font-medium">₹{currentPrice.toFixed(2)}</td>
        <td className="py-4 px-4 text-right tabular-nums">
          <div className={`font-medium whitespace-nowrap ${pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
            {pnl > 0 ? '+' : pnl < 0 ? '-' : ''}₹{Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className={`text-[12px] whitespace-nowrap ${pnlPercent > 0 ? 'text-green-500/80' : pnlPercent < 0 ? 'text-red-500/80' : 'text-dash-text-muted'}`}>
            {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
        </td>
        <td className="py-4 px-4 text-center">
          <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
            trade.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-500' : 
            trade.status === 'EXITED' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-500'
          }`}>
            {trade.status}
          </span>
        </td>
        <td className="py-4 px-4 text-right">
          <Link to={`/paper-trading/${trade._id}`} className="text-blue-500 hover:text-blue-400 text-[14px] font-medium transition-colors">
            View Details
          </Link>
        </td>
      </tr>
    );
  };

  let totalInvestment = 0;
  let totalCurrentValue = 0;
  
  activeTrades.forEach(trade => {
    const inv = trade.entryPrice * trade.totalQuantity;
    const currentPrice = trade.priceHistory.length > 0 ? trade.priceHistory[trade.priceHistory.length - 1].price : trade.entryPrice;
    const currVal = currentPrice * trade.totalQuantity;
    
    totalInvestment += inv;
    totalCurrentValue += currVal;
  });
  
  const totalPnL = totalCurrentValue - totalInvestment;
  const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-dash-text-primary mb-2">Options Paper Trading</h1>
          <p className="text-dash-text-secondary">Hypothetical trading and historical analysis for NSE Options.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                // We'll use a direct fetch here to avoid rewriting the RTK query api right now
                await fetch(`${import.meta.env.VITE_API_URL || 'https://fin-sight-gules.vercel.app/api/v1/'}papertrades/sync`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                });
                alert('Triggered live fetch from NSE. Please refresh the page in a few seconds.');
              } catch(e) {
                console.error(e);
              }
            }}
            className="bg-dash-elevated hover:bg-dash-border text-dash-text-primary font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors border border-dash-border shadow-sm"
          >
            <Clock className="w-4 h-4" /> Sync Live Prices
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Paper Trade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-dash-card rounded-xl border border-dash-border p-5 shadow-sm">
          <p className="text-[14px] text-dash-text-secondary mb-1">Total Investment (Active)</p>
          <p className="text-[24px] font-bold text-dash-text-primary">₹{totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dash-card rounded-xl border border-dash-border p-5 shadow-sm">
          <p className="text-[14px] text-dash-text-secondary mb-1">Current Value</p>
          <p className="text-[24px] font-bold text-dash-text-primary">₹{totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-dash-card rounded-xl border border-dash-border p-5 shadow-sm">
          <p className="text-[14px] text-dash-text-secondary mb-1">Total Unrealized P&L</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-[24px] font-bold whitespace-nowrap ${totalPnL > 0 ? 'text-green-500' : totalPnL < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
              {totalPnL > 0 ? '+' : totalPnL < 0 ? '-' : ''}₹{Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className={`text-[14px] font-medium whitespace-nowrap ${totalPnLPercent > 0 ? 'text-green-500/80' : totalPnLPercent < 0 ? 'text-red-500/80' : 'text-dash-text-muted'}`}>
              ({totalPnLPercent > 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8 flex gap-3">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-500 mb-1">Paper Trading / Hypothetical Analysis</h3>
          <p className="text-[14px] text-yellow-500/80">All P&L shown is hypothetical and does not represent actual executed trades. Historical prices may have a slight delay.</p>
        </div>
      </div>

      <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-dash-border flex justify-between items-center bg-dash-bg/50">
          <h2 className="text-[18px] font-bold text-dash-text-primary">Active Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-dash-elevated text-dash-text-secondary font-medium border-b border-dash-border">
              <tr>
                <th className="py-3 px-4 font-medium">Contract</th>
                <th className="py-3 px-4 font-medium text-right">Entry Price</th>
                <th className="py-3 px-4 font-medium text-right">Current Price</th>
                <th className="py-3 px-4 font-medium text-right">Hypothetical P&L</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-dash-text-muted">Loading trades...</td></tr>
              ) : activeTrades.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-dash-text-muted">No active paper trades.</td></tr>
              ) : (
                activeTrades.map(renderTradeRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-dash-border flex justify-between items-center bg-dash-bg/50">
          <h2 className="text-[18px] font-bold text-dash-text-primary">Completed Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-dash-elevated text-dash-text-secondary font-medium border-b border-dash-border">
              <tr>
                <th className="py-3 px-4 font-medium">Contract</th>
                <th className="py-3 px-4 font-medium text-right">Entry Price</th>
                <th className="py-3 px-4 font-medium text-right">Exit Price</th>
                <th className="py-3 px-4 font-medium text-right">Realized P&L</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-dash-text-muted">Loading trades...</td></tr>
              ) : exitedTrades.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-dash-text-muted">No completed trades yet.</td></tr>
              ) : (
                exitedTrades.map(renderTradeRow)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dash-card rounded-xl border border-dash-border shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-dash-border">
              <h2 className="text-lg font-bold text-dash-text-primary">New Paper Trade</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-dash-text-secondary hover:text-dash-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Underlying (e.g. NTPC)</label>
                  <input required type="text" value={formData.underlying} onChange={e => setFormData({...formData, underlying: e.target.value.toUpperCase()})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500 uppercase" placeholder="NTPC" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Option Type</label>
                  <select required value={formData.optionType} onChange={e => setFormData({...formData, optionType: e.target.value as any})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500">
                    <option value="CE">Call (CE)</option>
                    <option value="PE">Put (PE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Strike Price</label>
                  <input required type="number" step="any" value={formData.strikePrice} onChange={e => setFormData({...formData, strikePrice: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500" placeholder="320" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Expiry Date</label>
                  <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Entry Premium (₹)</label>
                <input required type="number" step="any" value={formData.entryPrice} onChange={e => setFormData({...formData, entryPrice: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500" placeholder="5.96" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Number of Lots</label>
                  <input required type="number" min="1" value={formData.numberOfLots} onChange={e => setFormData({...formData, numberOfLots: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500" placeholder="1" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Lot Size (Qty)</label>
                  <input required type="number" min="1" value={formData.lotSize} onChange={e => setFormData({...formData, lotSize: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-blue-500" placeholder="1500" />
                </div>
              </div>
              
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-[13px]">
                <div className="flex justify-between text-blue-400 mb-1">
                  <span>Total Quantity:</span>
                  <span className="font-semibold">{Number(formData.lotSize || 0) * Number(formData.numberOfLots || 0)}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>Investment:</span>
                  <span className="font-semibold">₹{((Number(formData.lotSize || 0) * Number(formData.numberOfLots || 0)) * Number(formData.entryPrice || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-dash-border flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-dash-text-secondary hover:text-dash-text-primary font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  {isCreating ? 'Adding...' : 'Add Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
