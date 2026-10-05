import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetPaperTradeByIdQuery, useExitPaperTradeMutation, api } from '../store/api';
import { ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useDispatch } from 'react-redux';

export default function PaperTradeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { data: tradeData, isLoading } = useGetPaperTradeByIdQuery(id || '');
  const [exitTrade, { isLoading: isExiting }] = useExitPaperTradeMutation();
  
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitForm, setExitForm] = useState({ price: '', reason: '' });
  const [mockPrice, setMockPrice] = useState('');

  if (isLoading) return <div className="text-center py-10 text-dash-text-muted">Loading trade details...</div>;
  if (!tradeData?.data) return <div className="text-center py-10 text-dash-text-muted">Trade not found.</div>;

  const trade = tradeData.data;
  
  const isExited = trade.status === 'EXITED';
  
  const currentPrice = isExited ? trade.exitPrice : (trade.priceHistory.length > 0 ? trade.priceHistory[trade.priceHistory.length - 1].price : trade.entryPrice);
  
  const pnl = (currentPrice - trade.entryPrice) * trade.totalQuantity;
  const investment = trade.entryPrice * trade.totalQuantity;
  const pnlPercent = investment > 0 ? (pnl / investment) * 100 : 0;

  // Analysis
  
  
  
  // Post-exit Analysis
  let postExitHigh = 0;
  let missedProfit = 0;
  if (isExited) {
    const exitTime = new Date(trade.exitDateTime).getTime();
    const postExitHistory = trade.priceHistory.filter((p: any) => new Date(p.timestamp).getTime() > exitTime);
    if (postExitHistory.length > 0) {
      postExitHigh = Math.max(...postExitHistory.map((p: any) => p.price));
      const potentialMaxPnL = (postExitHigh - trade.entryPrice) * trade.totalQuantity;
      missedProfit = Math.max(0, potentialMaxPnL - pnl);
    }
  }

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await exitTrade({
        id: trade._id,
        exitPrice: Number(exitForm.price),
        exitReason: exitForm.reason
      }).unwrap();
      setIsExitModalOpen(false);
    } catch (err) {
      console.error('Failed to exit trade', err);
      alert('Failed to exit trade.');
    }
  };

  const handleMockPrice = async () => {
    if (!mockPrice) return;
    try {
      await fetch(`https://fin-sight-gules.vercel.app/api/v1/papertrades/${trade._id}/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ price: Number(mockPrice) })
      });
      setMockPrice('');
      dispatch(api.util.invalidateTags(['PaperTrades'] as any));
    } catch (err) {
      console.error('Failed to add mock price', err);
    }
  };

  const chartData = trade.priceHistory.map((p: any) => ({
    time: new Date(p.timestamp).toLocaleDateString() + ' ' + new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    price: p.price
  }));

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <Link to="/paper-trading" className="inline-flex items-center text-[14px] text-dash-text-secondary hover:text-blue-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[24px] font-bold text-dash-text-primary">{trade.underlying} {trade.strikePrice} {trade.optionType}</h1>
            <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${
              trade.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-500' : 
              trade.status === 'EXITED' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-500'
            }`}>
              {trade.status}
            </span>
          </div>
          <p className="text-dash-text-secondary">Expiry: {new Date(trade.expiryDate).toLocaleDateString()}</p>
        </div>
        
        {!isExited && (
          <button onClick={() => setIsExitModalOpen(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium py-2 px-5 rounded-lg transition-colors">
            Book Profit / Exit Trade
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-dash-elevated rounded-xl border border-dash-border shadow-sm">
          <p className="text-[13px] text-dash-text-secondary mb-1">Investment</p>
          <p className="text-[20px] font-bold text-dash-text-primary">₹{investment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-[12px] text-dash-text-muted mt-1">{trade.totalQuantity} Qty ({trade.numberOfLots} Lots × {trade.lotSize})</p>
        </div>
        <div className="p-4 bg-dash-elevated rounded-xl border border-dash-border shadow-sm">
          <p className="text-[13px] text-dash-text-secondary mb-1">Entry Price</p>
          <p className="text-[20px] font-bold text-dash-text-primary">₹{trade.entryPrice.toFixed(2)}</p>
          <p className="text-[12px] text-dash-text-muted mt-1">{new Date(trade.entryDateTime).toLocaleDateString()}</p>
        </div>
        <div className="p-4 bg-dash-elevated rounded-xl border border-dash-border shadow-sm">
          <p className="text-[13px] text-dash-text-secondary mb-1">{isExited ? 'Exit Price' : 'Current Price'}</p>
          <p className="text-[20px] font-bold text-dash-text-primary">₹{currentPrice.toFixed(2)}</p>
          {isExited && <p className="text-[12px] text-dash-text-muted mt-1">{new Date(trade.exitDateTime).toLocaleDateString()}</p>}
        </div>
        <div className="p-4 bg-dash-elevated rounded-xl border border-dash-border shadow-sm">
          <p className="text-[13px] text-dash-text-secondary mb-1">{isExited ? 'Realized P&L' : 'Unrealized P&L'}</p>
          <p className={`text-[20px] font-bold ${pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
            {pnl > 0 ? '+' : ''}₹{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className={`text-[12px] font-medium mt-1 ${pnlPercent > 0 ? 'text-green-500/80' : pnlPercent < 0 ? 'text-red-500/80' : 'text-dash-text-muted'}`}>
            {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}% Return
          </p>
        </div>
      </div>

      <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm p-6 mb-8">
        <h2 className="text-[18px] font-bold text-dash-text-primary mb-6">Price History Chart</h2>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#334155" strokeDasharray="5 5" opacity={0.3} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={30} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val}`} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <ReferenceLine y={trade.entryPrice} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Entry', fill: '#94a3b8', fontSize: 12 }} />
                {isExited && <ReferenceLine y={trade.exitPrice} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'bottom', value: 'Exit', fill: '#ef4444', fontSize: 12 }} />}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-dash-text-muted border border-dashed border-dash-border rounded-lg">
              No historical data available yet.
            </div>
          )}
        </div>
        
        {/* Mock Price Input for MVP Demonstration */}
        {!isExited && (
          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-between">
            <span className="text-[13px] text-dash-text-secondary">Simulate a price update (for testing):</span>
            <div className="flex gap-2">
              <input type="number" step="any" value={mockPrice} onChange={e=>setMockPrice(e.target.value)} placeholder="New Price" className="bg-dash-bg border border-dash-border rounded px-3 py-1.5 text-[13px] text-dash-text-primary focus:outline-none focus:border-blue-500 w-32" />
              <button onClick={handleMockPrice} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[13px] font-medium transition-colors">Add Point</button>
            </div>
          </div>
        )}
      </div>

      {isExited && (
        <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-dash-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> Post-Exit Analysis
          </h2>
          <p className="text-[14px] text-dash-text-secondary mb-6">What happened after you exited the trade?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-dash-border pb-2">
                <span className="text-[14px] text-dash-text-secondary">Your Realized P&L</span>
                <span className={`font-semibold ${pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>{pnl > 0 ? '+' : ''}₹{pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dash-border pb-2">
                <span className="text-[14px] text-dash-text-secondary">Your Exit Price</span>
                <span className="font-semibold text-dash-text-primary">₹{trade.exitPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-dash-border pb-2">
                <span className="text-[14px] text-dash-text-secondary">Post-Exit High Price</span>
                <span className="font-semibold text-dash-text-primary">₹{postExitHigh.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-dash-border pb-2">
                <span className="text-[14px] text-dash-text-secondary">Potential Missed Profit</span>
                <span className="font-semibold text-yellow-500">₹{missedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-dash-elevated p-4 rounded-lg border border-dash-border flex flex-col justify-center">
              {missedProfit > 0 ? (
                <>
                  <p className="text-[13px] text-dash-text-secondary text-center mb-1">If you had held to the high of ₹{postExitHigh.toFixed(2)}, you could have made an additional:</p>
                  <p className="text-[24px] font-bold text-yellow-500 text-center">₹{missedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </>
              ) : (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-[14px] font-medium text-green-500">Excellent Exit!</p>
                  <p className="text-[12px] text-dash-text-secondary mt-1">The price has not exceeded your exit price.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dash-card rounded-xl border border-dash-border shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-dash-border">
              <h2 className="text-lg font-bold text-dash-text-primary">Book Profit / Exit</h2>
              <button onClick={() => setIsExitModalOpen(false)} className="text-dash-text-secondary hover:text-dash-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleExitSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Exit Price (₹)</label>
                <input required type="number" step="any" value={exitForm.price} onChange={e => setExitForm({...exitForm, price: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-red-500" placeholder="8.50" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-dash-text-secondary mb-1">Notes / Reason (Optional)</label>
                <textarea value={exitForm.reason} onChange={e => setExitForm({...exitForm, reason: e.target.value})} className="w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-dash-text-primary focus:outline-none focus:border-red-500" placeholder="Hit target profit..." rows={3}></textarea>
              </div>

              {exitForm.price && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-[13px]">
                  <div className="flex justify-between text-red-400">
                    <span>Estimated Realized P&L:</span>
                    <span className="font-semibold text-lg">
                      {Number(exitForm.price) > trade.entryPrice ? '+' : ''}
                      ₹{((Number(exitForm.price) - trade.entryPrice) * trade.totalQuantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-dash-border flex justify-end gap-3">
                <button type="button" onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 text-dash-text-secondary hover:text-dash-text-primary font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isExiting} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium transition-colors">
                  {isExiting ? 'Processing...' : 'Confirm Exit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
