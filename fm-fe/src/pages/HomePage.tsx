import React, { useState, useRef, useEffect } from 'react';

import { 
  useGetInvestmentsQuery, 
  useAddInvestmentMutation,
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useGetAllCompaniesQuery,
  useGetTopCompaniesQuery,
  useUpdateInvestmentMutation,
  useDeleteInvestmentMutation,
  useGetLivePricesQuery,
  useAnalyzeCompanyMutation,
  useSearchSymbolsQuery,
  useGetMetalsQuery,
  useLazyGetAnnualReportQuery
} from '../store/api';
import { TrendingUp, Briefcase, Wallet, PieChart, Activity, Search, Plus, X, BarChart2, Info, Edit2, ExternalLink, Sparkles, Loader2, MoreVertical, Download, MinusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import AdvancedChartWidget from '../components/AdvancedChartWidget';

export default function HomePage() {
    const { data: investmentsData, isLoading: loadingInvestments } = useGetInvestmentsQuery();
  const { data: metals } = useGetMetalsQuery(undefined, { pollingInterval: 60000 });
  const [addInvestment, { isLoading: addingInvestment }] = useAddInvestmentMutation();
  const [triggerGetAnnualReport] = useLazyGetAnnualReportQuery();
  const [reportDropdownOpenId, setReportDropdownOpenId] = useState<string | null>(null);
  const [reportsMap, setReportsMap] = useState<Record<string, { title: string, url: string }[]>>({});
  const [loadingReportsMap, setLoadingReportsMap] = useState<Record<string, boolean>>({});
  
  const { data: watchlistData, isLoading: loadingWatchlist } = useGetWatchlistQuery();
  const [addToWatchlist, { isLoading: addingToWatchlist }] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const { data: topCompaniesData, isLoading: loadingTop } = useGetTopCompaniesQuery();
  const topCompanies = topCompaniesData?.data || [];

  const { data: allCompaniesData } = useGetAllCompaniesQuery();
  const allCompanies = allCompaniesData?.data || [];

  const [activeTab, setActiveTab] = useState<'watchlist' | 'top'>('watchlist');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      // Note: A more robust approach for multiple dropdowns might use a ref for the table, but a simple body click close is fine here.
      setReportDropdownOpenId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCompanies = searchSymbol 
    ? allCompanies.filter(c => c.symbol.toLowerCase().includes(searchSymbol.toLowerCase()) || c.name.toLowerCase().includes(searchSymbol.toLowerCase()))
    : [];

  const [form, setForm] = useState({ 
    symbol: '', 
    companyName: '', 
    assetClass: 'Indian Equity', 
    tradeType: 'Delivery', 
    shares: '', 
    averagePrice: '',
    manualCurrentPrice: '',
    dateInvested: new Date().toISOString().split('T')[0],
    sipFrequency: 'Monthly',
    sipAmount: '',
    isAmcSip: false,
    sipStartDate: new Date().toISOString().split('T')[0],
    sipStatus: 'Active',
    sipInstallmentsPaid: '0'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const { data: searchResults, isFetching: isSearching } = useSearchSymbolsQuery(form.symbol, {
    skip: form.symbol.length < 3 || !showSymbolDropdown
  });

  const watchlist = watchlistData?.data || [];
  const investments = investmentsData?.data || [];
  const [updateInvestment, { isLoading: updatingInvestment }] = useUpdateInvestmentMutation();

  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [sellModalData, setSellModalData] = useState<{ id: string, symbol: string, totalShares: number, averagePrice: number, sharesToSell: number | '' } | null>(null);

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellModalData || !sellModalData.sharesToSell) return;
    try {
      const sellAmount = Number(sellModalData.sharesToSell);
      if (sellAmount >= sellModalData.totalShares) {
        await deleteInvestment(sellModalData.id).unwrap();
      } else {
        await updateInvestment({
          id: sellModalData.id,
          shares: sellModalData.totalShares - sellAmount,
          averagePrice: sellModalData.averagePrice
        }).unwrap();
      }
      setSellModalData(null);
    } catch (err) {
      console.error("Failed to sell investment");
    }
  };

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol) return;
    try {
      await addToWatchlist(searchSymbol).unwrap();
      setSearchSymbol('');
    } catch (err) {
      console.error("Failed to add to watchlist");
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol || !form.companyName || !form.shares || !form.averagePrice) return;
    
    try {
      if (editingId) {
        await updateInvestment({
          id: editingId,
          ...form,
          shares: Number(form.shares),
          averagePrice: Number(form.averagePrice)
        }).unwrap();
      } else {
        await addInvestment({
          ...form,
          shares: Number(form.shares),
          averagePrice: Number(form.averagePrice)
        }).unwrap();
      }
      setForm({ 
        symbol: '', 
        companyName: '', 
        assetClass: 'Indian Equity', 
        tradeType: 'Delivery', 
        shares: '', 
        averagePrice: '',
        manualCurrentPrice: '',
        dateInvested: new Date().toISOString().split('T')[0],
        sipFrequency: 'Monthly',
        sipAmount: '',
        isAmcSip: false,
        sipStartDate: new Date().toISOString().split('T')[0],
        sipStatus: 'Active',
        sipInstallmentsPaid: '0'
      });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save investment");
    }
  };

  const handleEditClick = (inv: any) => {
    setEditingId(inv._id);
    setForm({
      symbol: inv.symbol,
      companyName: inv.companyName,
      assetClass: inv.assetClass || 'Indian Equity',
      tradeType: inv.tradeType || 'Delivery',
      shares: inv.shares.toString(),
      averagePrice: inv.averagePrice.toString(),
      sipFrequency: inv.sipFrequency || 'Monthly',
      sipAmount: inv.sipAmount?.toString() || '',
      isAmcSip: inv.isAmcSip || false,
      sipStartDate: inv.sipStartDate ? new Date(inv.sipStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      sipStatus: inv.sipStatus || 'Active',
      sipInstallmentsPaid: inv.sipInstallmentsPaid?.toString() || '0',
      manualCurrentPrice: inv.manualCurrentPrice?.toString() || '',
      dateInvested: inv.dateInvested ? new Date(inv.dateInvested).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    // Scroll to form at the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [analyzeCompany] = useAnalyzeCompanyMutation();
  const [analyzingSymbol, setAnalyzingSymbol] = useState<string | null>(null);
  const [analysisModalData, setAnalysisModalData] = useState<{ symbol: string, analysis: string } | null>(null);

  const handleAnalyzeCompanyClick = async (symbol: string) => {
    try {
      setAnalyzingSymbol(symbol);
      const res = await analyzeCompany({ symbol }).unwrap();
      if (res?.data?.analysis) {
        setAnalysisModalData({ symbol, analysis: res.data.analysis });
      }
    } catch (err) {
      alert("Failed to analyze company fundamentals.");
    } finally {
      setAnalyzingSymbol(null);
    }
  };

  // Gather all unique symbols from investments, watchlist, and top companies
  const allSymbolsSet = new Set<string>();
  
  investments.forEach((i: any) => {
    const sym = i.assetClass === 'Indian Equity' && !i.symbol.includes('.') ? `${i.symbol}.NS` : i.symbol;
    allSymbolsSet.add(sym);
  });
  
  watchlist.forEach((c: any) => {
    // Assuming watchlist has Indian Equities, default to .NS
    const sym = !c.symbol.includes('.') ? `${c.symbol}.NS` : c.symbol;
    allSymbolsSet.add(sym);
  });
  
  topCompanies.forEach((c: any) => {
    const sym = !c.symbol.includes('.') ? `${c.symbol}.NS` : c.symbol;
    allSymbolsSet.add(sym);
  });

  const uniqueSymbols = Array.from(allSymbolsSet);
  const { data: livePricesData, isLoading: loadingPrices } = useGetLivePricesQuery(uniqueSymbols, { skip: uniqueSymbols.length === 0 });
  const livePrices = livePricesData?.data || {};

  // Calculate P&L
  const enrichedInvestments = investments.map((inv: any) => {
    const lookupSymbol = inv.assetClass === 'Indian Equity' && !inv.symbol.includes('.') ? `${inv.symbol}.NS` : inv.symbol;
    
    let currentPrice;
    
    // Check if it's a commodity and we have live metal prices
    const symUpper = inv.symbol.toUpperCase();
    const nameUpper = (inv.name || "").toUpperCase();
    let isCommodityLive = false;
    
    if ((inv.assetClass === 'COMMODITY' || inv.assetClass === 'Physical') && metals) {
      if (symUpper.includes('GOLD') || nameUpper.includes('GOLD')) { currentPrice = metals.gold; isCommodityLive = true; }
      else if (symUpper.includes('SILVER') || nameUpper.includes('SILVER')) { currentPrice = metals.silver; isCommodityLive = true; }
      else if (symUpper.includes('PLATINUM') || nameUpper.includes('PLATINUM')) { currentPrice = metals.platinum; isCommodityLive = true; }
    }
    
    if (!isCommodityLive) {
      // 1. Manual Override (e.g. for Physical Commodities)
      if (inv.manualCurrentPrice) {
        currentPrice = inv.manualCurrentPrice;
      } else {
        // 2. Try real-time API
        currentPrice = livePrices[lookupSymbol]?.price;
        
        // 3. Fallback to scraped database
        if (!currentPrice) {
          const found = allCompanies.find((c: any) => c.symbol === inv.symbol);
          currentPrice = found?.currentPrice;
        }
        
        // 4. Absolute Fallback: Use the average purchase price
        if (!currentPrice) {
          currentPrice = inv.averagePrice;
        }
      }
    }

    const investedValue = inv.shares * inv.averagePrice;
    const currentValue = inv.shares * currentPrice;
    const pnl = currentValue - investedValue;
    const pnlPercent = (pnl / investedValue) * 100;

    return { ...inv, currentPrice, investedValue, currentValue, pnl, pnlPercent };
  });

  const enrichedWatchlist = watchlist.map((c: any) => {
    const sym = !c.symbol.includes('.') ? `${c.symbol}.NS` : c.symbol;
    return { ...c, liveData: livePrices[sym] };
  });

  const enrichedTopCompanies = topCompanies.map((c: any) => {
    const sym = !c.symbol.includes('.') ? `${c.symbol}.NS` : c.symbol;
    return { ...c, liveData: livePrices[sym] };
  });

  const totalInvestedValue = enrichedInvestments.reduce((acc: number, inv: any) => acc + inv.investedValue, 0);
  const totalCurrentValue = enrichedInvestments.reduce((acc: number, inv: any) => acc + inv.currentValue, 0);
  const totalPnL = totalCurrentValue - totalInvestedValue;
  const totalPnLPercent = totalInvestedValue > 0 ? (totalPnL / totalInvestedValue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Dashboard / Portfolio (68-70%) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {selectedSymbol ? (
          <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm flex flex-col h-full min-h-[700px] overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="px-6 py-4 border-b border-dash-border flex justify-between items-center bg-dash-header/50">
              <h2 className="text-[18px] font-semibold text-dash-text-primary flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                {selectedSymbol} Advanced Chart
              </h2>
              <button 
                onClick={() => setSelectedSymbol(null)}
                className="text-[13px] text-dash-text-secondary hover:text-dash-text-primary flex items-center gap-1 transition-colors bg-dash-bg border border-dash-border px-3 py-1.5 rounded-lg"
              >
                <X className="w-4 h-4" /> Close Chart
              </button>
            </div>
            <div className="flex-1 w-full bg-dash-bg/50 p-2">
              <AdvancedChartWidget defaultSymbol={`BSE:${selectedSymbol}`} />
            </div>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dash-card p-5 rounded-xl border border-dash-border hover:border-gray-500/30 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-dash-text-secondary text-[14px] font-medium">Total Invested</h3>
              </div>
            </div>
            {loadingPrices || loadingInvestments ? (
              <div className="h-8 w-32 bg-dash-border/30 rounded animate-pulse"></div>
            ) : (
              <p className="text-[28px] font-bold tracking-tight text-dash-text-primary">
                ₹{totalInvestedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          <div className="bg-dash-card p-5 rounded-xl border border-dash-border hover:border-gray-500/30 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-dash-text-secondary text-[14px] font-medium">Current Value</h3>
              </div>
            </div>
            {loadingPrices || loadingInvestments ? (
              <div className="h-8 w-32 bg-dash-border/30 rounded animate-pulse"></div>
            ) : (
              <p className="text-[28px] font-bold tracking-tight text-dash-text-primary">
                ₹{totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="bg-dash-card p-5 rounded-xl border border-dash-border hover:border-gray-500/30 transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${totalPnL > 0 ? 'bg-green-500/10 text-green-500' : totalPnL < 0 ? 'bg-red-500/10 text-red-500' : 'bg-dash-elevated text-dash-text-primary'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-dash-text-secondary text-[14px] font-medium">Overall P&L</h3>
              </div>
            </div>
            {loadingPrices || loadingInvestments ? (
              <div className="h-8 w-40 bg-dash-border/30 rounded animate-pulse"></div>
            ) : (
              <div className="flex items-baseline gap-2">
                <p className={`text-[28px] font-bold tracking-tight ${totalPnL > 0 ? 'text-green-500' : totalPnL < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
                  {totalPnL > 0 ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-[14px] font-medium ${totalPnL > 0 ? 'text-green-500/80' : totalPnL < 0 ? 'text-red-500/80' : 'text-dash-text-muted'}`}>
                  ({totalPnLPercent > 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                </p>
              </div>
            )}
          </div>
        </div>
        {/* ADD INVESTMENT FORM */}
        <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm p-6 mb-6 z-10 relative">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[16px] font-semibold text-dash-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" /> Add Trade / SIP
            </h3>
            <div className="relative group flex items-center">
              <Info className="w-4 h-4 text-dash-text-muted cursor-help hover:text-dash-text-primary transition-colors" />
              <div className="absolute top-full left-0 mt-2 w-[280px] p-3 bg-[#131722] border border-dash-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[12px] text-dash-text-secondary ">
                <p className="font-semibold text-dash-text-primary mb-1">How to log a trade:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Symbol:</strong> Ticker (e.g., TCS, AAPL, EURUSD)</li>
                  <li><strong>Company:</strong> Full name (e.g., Tata Consultancy)</li>
                  <li><strong>Class & Type:</strong> Forex vs Equity, Intraday, Delivery, or SIP</li>
                  <li><strong>Shares & Price:</strong> Total qty and avg entry price</li>
                </ul>
                <div className="absolute -top-1.5 left-4 w-3 h-3 bg-[#131722] border-t border-l border-dash-border rotate-45"></div>
              </div>
            </div>
          </div>
          <form onSubmit={handleAddInvestment} className="flex flex-col flex-wrap gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Symbol</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center ">
                    <Search className="h-4 w-4 text-dash-text-muted" />
                  </div>
                  <input type="text" placeholder="e.g. TCS or Navi ELSS" className="w-full pl-9 pr-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow uppercase" value={form.symbol} onChange={e => { setForm({...form, symbol: e.target.value}); setShowSymbolDropdown(true); }} onFocus={() => setShowSymbolDropdown(true)} onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)} required />
                  
                  {showSymbolDropdown && form.symbol.length >= 3 && (
                    <div className="absolute z-50 mt-1 w-[300px] bg-dash-card border border-dash-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {isSearching ? (
                        <div className="px-4 py-3 text-[12px] text-dash-text-muted flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                        </div>
                      ) : searchResults?.data?.length === 0 ? (
                        <div className="px-4 py-3 text-[12px] text-dash-text-muted">No results found</div>
                      ) : (
                        <div className="max-h-[250px] overflow-y-auto">
                          {searchResults?.data?.map((res, i) => (
                            <button
                              key={i}
                              type="button"
                              className="w-full text-left px-3 py-2.5 hover:bg-dash-elevated border-b border-dash-border/50 last:border-0 transition-colors flex flex-col"
                              onClick={() => {
                                setForm({
                                  ...form,
                                  symbol: res.symbol,
                                  companyName: res.name,
                                  assetClass: res.assetClass
                                });
                                setShowSymbolDropdown(false);
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-[13px] text-dash-text-primary">{res.symbol}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 uppercase">{res.assetClass}</span>
                              </div>
                              <span className="text-[11px] text-dash-text-secondary truncate block mt-0.5">{res.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Company Name</label>
                <input type="text" placeholder="Company Name" className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} required />
              </div>

              <div className="flex-1 min-w-[120px]">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Asset Class</label>
                <select className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 transition-shadow" value={form.assetClass} onChange={e => setForm({...form, assetClass: e.target.value})}>
                  <option value="Indian Equity">Indian Equity</option>
                  <option value="US Equity">US Equity</option>
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="Forex">Forex</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Commodity">Commodity</option>
                </select>
              </div>

              <div className="flex-1 min-w-[100px]">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Trade Type</label>
                <select className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 transition-shadow" value={form.tradeType} onChange={e => setForm({...form, tradeType: e.target.value})}>
                  <option value="Delivery">Delivery</option>
                  <option value="Intraday">Intraday</option>
                  <option value="SIP">SIP</option>
                </select>
              </div>

              <div className="flex-1 sm:flex-none w-full sm:w-32">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">{form.assetClass === 'Mutual Fund' ? 'Units' : form.assetClass === 'Commodity' ? 'Weight (g)' : 'Quantity'}</label>
                <input type="number" placeholder="0" className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.shares} onChange={e => setForm({...form, shares: e.target.value})} required min="0" step="any" />
              </div>
              
              <div className="flex-1 sm:flex-none w-full sm:w-40">
                <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">{form.assetClass === 'Mutual Fund' ? 'Avg NAV' : form.assetClass === 'Commodity' ? 'Price (per g)' : 'Avg Price'}</label>
                <input type="number" placeholder="₹0.00" className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.averagePrice} onChange={e => setForm({...form, averagePrice: e.target.value})} required min="0" step="any" />
              </div>

              {form.assetClass === 'Commodity' && (
                <div className="flex-1 sm:flex-none w-full sm:w-36 animate-in fade-in slide-in-from-left-2">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Purchase Date</label>
                  <input type="date" style={{ colorScheme: 'dark' }} className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.dateInvested} onChange={e => setForm({...form, dateInvested: e.target.value})} required />
                </div>
              )}
              
              {form.assetClass === 'Commodity' && editingId && (
                <div className="flex-1 sm:flex-none w-full sm:w-40 animate-in fade-in slide-in-from-left-2">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Live Price Override</label>
                  <input type="number" placeholder="Optional" className="w-full px-3 h-10 text-[14px] bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.manualCurrentPrice} onChange={e => setForm({...form, manualCurrentPrice: e.target.value})} min="0" step="any" />
                </div>
              )}
              
              <div className="flex items-end min-w-[160px]">
                <div className="flex items-center gap-2 w-full">
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setForm({ symbol: '', companyName: '', assetClass: 'Indian Equity', tradeType: 'Delivery', shares: '', averagePrice: '', manualCurrentPrice: '', dateInvested: new Date().toISOString().split('T')[0], sipFrequency: 'Monthly', sipAmount: '', isAmcSip: false, sipStartDate: new Date().toISOString().split('T')[0], sipStatus: 'Active', sipInstallmentsPaid: '0' }); }} className="flex-1 h-10 px-4 bg-dash-card hover:bg-dash-elevated border border-dash-border text-dash-text-primary text-[14px] font-medium rounded-lg flex items-center justify-center transition-colors">
                      Cancel
                    </button>
                  )}
                  <button disabled={addingInvestment || updatingInvestment} type="submit" className="flex-1 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-medium rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
                    {editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>

            {form.tradeType === 'SIP' && (
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full p-4 bg-dash-bg border border-dash-border rounded-lg mt-2 animate-in slide-in-from-top-2">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">SIP Amount</label>
                  <input type="number" placeholder="e.g. 2000" className="w-full px-3 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.sipAmount} onChange={e => setForm({...form, sipAmount: e.target.value})} min="0" step="any" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Frequency</label>
                  <select className="w-full px-3 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 transition-shadow" value={form.sipFrequency} onChange={e => setForm({...form, sipFrequency: e.target.value})}>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="15 Days">15 Days</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Start Date</label>
                  <input type="date" style={{ colorScheme: 'dark' }} className="w-full px-3 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.sipStartDate} onChange={e => setForm({...form, sipStartDate: e.target.value})} />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Paid Inst.</label>
                  <input type="number" placeholder="e.g. 5" className="w-full px-3 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={form.sipInstallmentsPaid} onChange={e => setForm({...form, sipInstallmentsPaid: e.target.value})} min="0" />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[12px] font-medium text-dash-text-muted mb-1.5 ml-1">Status</label>
                  <select className="w-full px-3 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 transition-shadow" value={form.sipStatus} onChange={e => setForm({...form, sipStatus: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="flex items-center h-10 mt-6 min-w-[100px]">
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-dash-text-primary">
                    <input type="checkbox" className="w-4 h-4 rounded border-dash-border bg-dash-card text-blue-500 focus:ring-blue-500/50" checked={form.isAmcSip} onChange={e => setForm({...form, isAmcSip: e.target.checked})} />
                    AMC SIP
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* INVESTMENTS TABLE */}
        <div className="bg-dash-card rounded-xl border border-dash-border overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-dash-border flex justify-between items-center bg-dash-header/50">
            <h2 className="text-[18px] font-semibold text-dash-text-primary flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-dash-text-secondary" />
              Portfolio
            </h2>
          </div>
          
          <div className="overflow-x-auto min-h-[200px]">
            {loadingInvestments ? (
              <p className="text-dash-text-muted text-center py-10 text-[14px]">Loading portfolio...</p>
            ) : investments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-dash-elevated flex items-center justify-center text-dash-text-muted mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-dash-text-primary font-medium mb-1">No investments yet</p>
                <p className="text-dash-text-secondary text-[14px] mb-6 max-w-sm">Start building your portfolio by adding your first investment below.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dash-border text-dash-text-muted text-[12px] font-medium tracking-wide">
                    <th className="py-4 pl-6 pr-2 font-normal text-center w-12 text-dash-text-muted">#</th>
                    <th className="py-4 pl-2 pr-4 font-normal text-dash-text-muted">Symbol / Company</th>
                    <th className="py-4 px-4 font-normal text-dash-text-muted hidden lg:table-cell">Asset Class</th>
                    <th className="py-4 px-4 font-normal text-dash-text-muted hidden md:table-cell">Type</th>
                    <th className="py-4 px-4 font-normal text-right text-dash-text-muted">Qty</th>
                    <th className="py-4 px-4 font-normal text-right text-dash-text-muted whitespace-nowrap">Avg. Price / Inv.</th>
                    <th className="py-4 px-4 font-normal text-right text-dash-text-muted">LTP / Cur.</th>
                    <th className="py-4 pr-4 pl-4 font-normal text-right text-dash-text-muted">P&L</th>
                    <th className="py-4 pr-6 pl-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border">
                  {enrichedInvestments.map((inv: any, index: number) => (
                    <tr key={inv._id} className="hover:bg-dash-elevated transition-colors text-[14px]">
                      <td className="py-4 pl-6 pr-2 text-center text-[12px] text-dash-text-muted font-medium">
                        {index + 1}
                      </td>
                      <td className="py-4 pl-2 pr-4">
                        {inv.assetClass === 'Mutual Fund' ? (
                          <div className="inline-flex items-center gap-1.5 font-[500] tracking-wide text-dash-text-primary uppercase">
                            {inv.symbol}
                          </div>
                        ) : (
                          <a 
                            href={`https://www.screener.in/company/${inv.symbol}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-[500] tracking-wide text-dash-text-primary hover:text-blue-400 uppercase transition-colors group/link"
                            title="View on Screener.in"
                          >
                            {inv.symbol}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        )}
                        <div className="text-[12px] font-medium text-dash-text-secondary truncate max-w-[120px] mt-0.5" title={inv.companyName}>
                          {inv.companyName}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-dash-text-primary hidden lg:table-cell">
                        <span className="px-2.5 py-1 rounded-md bg-dash-bg border border-dash-border/50 text-[11px] font-medium tracking-wide text-dash-text-muted uppercase whitespace-nowrap">{inv.assetClass || 'Indian Equity'}</span>
                      </td>
                      <td className="py-4 px-4 text-dash-text-primary hidden md:table-cell">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide uppercase whitespace-nowrap ${inv.tradeType === 'Intraday' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : inv.tradeType === 'SIP' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {inv.tradeType || 'Delivery'}
                          </span>
                          {inv.tradeType === 'SIP' && inv.sipFrequency && (
                            <span className="text-[10px] text-dash-text-muted mt-0.5 whitespace-nowrap">
                              {inv.sipFrequency} {inv.sipAmount ? `(₹${inv.sipAmount})` : ''}
                            </span>
                          )}
                          {inv.tradeType === 'SIP' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {inv.sipStatus === 'Paused' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded uppercase">Paused</span>
                              )}
                              {inv.sipStatus === 'Completed' && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded uppercase">Done</span>
                              )}
                              {inv.isAmcSip && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded uppercase">AMC</span>
                              )}
                              {inv.sipInstallmentsPaid > 0 && (
                                <span className="text-[9px] text-dash-text-secondary">{inv.sipInstallmentsPaid} Paid</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-dash-text-primary tabular-nums font-medium">{Number(inv.shares).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                      <td className="py-4 px-4 text-right tabular-nums">
                        <div className="text-dash-text-primary font-medium tracking-wide whitespace-nowrap">
                          ₹{inv.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-1">
                          <span className="inline-block px-1.5 py-0.5 bg-dash-elevated border border-dash-border rounded text-[10px] text-dash-text-muted whitespace-nowrap" title="Total Invested Value">
                            Σ ₹{inv.investedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right tabular-nums">
                        {loadingPrices || loadingInvestments ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="h-4 w-16 bg-dash-border/30 rounded animate-pulse"></div>
                            <div className="h-3 w-20 bg-dash-border/30 rounded animate-pulse mt-0.5"></div>
                          </div>
                        ) : (
                          <>
                            <div className={`font-medium tracking-wide whitespace-nowrap ${inv.pnl >= 0 ? 'text-green-500' : inv.pnl < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
                              ₹{inv.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 bg-dash-elevated border border-dash-border rounded text-[10px] text-dash-text-muted whitespace-nowrap" title="Total Current Value">
                                Σ ₹{inv.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-4 pr-4 pl-4 text-right tabular-nums">
                        {loadingPrices || loadingInvestments ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="h-4 w-16 bg-dash-border/30 rounded animate-pulse"></div>
                            <div className="h-3 w-12 bg-dash-border/30 rounded animate-pulse mt-0.5"></div>
                          </div>
                        ) : (
                          <>
                            <div className={`font-[500] tracking-wide whitespace-nowrap ${inv.pnl > 0 ? 'text-green-500' : inv.pnl < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
                              {inv.pnl > 0 ? '+' : ''}₹{inv.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[12px] font-medium tracking-wide whitespace-nowrap mt-0.5 ${inv.pnlPercent > 0 ? 'text-green-500/90' : inv.pnlPercent < 0 ? 'text-red-500/90' : 'text-dash-text-muted'}`}>
                              {inv.pnlPercent > 0 ? '+' : ''}{inv.pnlPercent.toFixed(2)}%
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-4 pr-6 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inv.assetClass !== 'Mutual Fund' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeCompanyClick(inv.symbol);
                              }} 
                              disabled={analyzingSymbol === inv.symbol}
                              className="p-1.5 text-dash-text-muted hover:text-purple-400 hover:bg-purple-400/10 rounded-md transition-colors disabled:opacity-50" 
                              title="AI Fundamental Analysis"
                            >
                              {analyzingSymbol === inv.symbol ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(inv);
                            }} 
                            className="p-1.5 text-dash-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" 
                            title="Edit Investment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSellModalData({
                                id: inv._id,
                                symbol: inv.symbol,
                                totalShares: inv.shares,
                                averagePrice: inv.averagePrice,
                                sharesToSell: inv.shares
                              });
                            }} 
                            className="p-1.5 text-dash-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" 
                            title="Sell / Withdraw"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                          {inv.assetClass !== 'Mutual Fund' && (
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (reportDropdownOpenId === inv._id) {
                                    setReportDropdownOpenId(null);
                                  } else {
                                    setReportDropdownOpenId(inv._id);
                                    if (!reportsMap[inv.symbol]) {
                                      setLoadingReportsMap(prev => ({ ...prev, [inv.symbol]: true }));
                                      triggerGetAnnualReport(inv.symbol).unwrap().then(res => {
                                        setReportsMap(prev => ({ ...prev, [inv.symbol]: res.data }));
                                      }).catch(() => {
                                        setReportsMap(prev => ({ ...prev, [inv.symbol]: [] }));
                                      }).finally(() => {
                                        setLoadingReportsMap(prev => ({ ...prev, [inv.symbol]: false }));
                                      });
                                    }
                                  }
                                }}
                                className="p-1.5 text-dash-text-muted hover:text-white hover:bg-dash-bg-hover rounded-md transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {reportDropdownOpenId === inv._id && (
                                <div 
                                  className="absolute right-0 top-full mt-1 w-64 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="p-3 border-b border-slate-700 bg-slate-800">
                                    <h4 className="text-sm font-semibold text-white">Annual Reports</h4>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto">
                                    {loadingReportsMap[inv.symbol] ? (
                                      <div className="flex items-center justify-center p-4">
                                        <Loader2 className="w-5 h-5 text-dash-text-muted animate-spin" />
                                      </div>
                                    ) : reportsMap[inv.symbol] && reportsMap[inv.symbol].length > 0 ? (
                                      <div className="py-1 bg-[#0f172a]">
                                        {reportsMap[inv.symbol].map((report, i) => (
                                          <a 
                                            key={i}
                                            href={report.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between px-4 py-2 text-sm text-dash-text-primary hover:bg-slate-700 hover:text-white transition-colors"
                                          >
                                            <span className="truncate pr-2">{report.title}</span>
                                            <Download className="w-4 h-4 shrink-0 text-dash-text-muted" />
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-4 text-sm text-dash-text-muted text-center bg-[#0f172a]">
                                        No reports found.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN: Watchlist & Top Growth (30-32%) */}
      <div className="lg:col-span-4 flex flex-col gap-6">

        {/* Commodities / Precious Metals */}
        <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="text-[16px] font-bold text-dash-text-primary">Precious Metals (Live)</h3>
          </div>
          
          {metals ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-dash-bg rounded-lg border border-dash-border p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <span className="text-[16px] font-bold text-yellow-500">Au</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Gold</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[18px] font-bold text-dash-text-primary tracking-wide">₹{metals.gold.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-dash-bg rounded-lg border border-dash-border p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-400/20 flex items-center justify-center border border-gray-400/30">
                    <span className="text-[16px] font-bold text-gray-300">Ag</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Silver</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[18px] font-bold text-dash-text-primary tracking-wide">₹{metals.silver.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-dash-bg rounded-lg border border-dash-border p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-300/20 flex items-center justify-center border border-slate-300/30">
                    <span className="text-[16px] font-bold text-slate-200">Pt</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Platinum</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[18px] font-bold text-dash-text-primary tracking-wide">₹{metals.platinum.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[200px]">
              <Loader2 className="w-6 h-6 text-dash-text-muted animate-spin" />
            </div>
          )}
        </div>

        <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="flex border-b border-dash-border bg-dash-header/50">
            <button 
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-4 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'watchlist' ? 'text-dash-text-primary border-b-2 border-blue-500' : 'text-dash-text-muted hover:text-dash-text-primary'}`}
            >
              <TrendingUp className={`w-4 h-4 ${activeTab === 'watchlist' ? 'text-green-500' : ''}`} />
              Watchlist
            </button>
            <button 
              onClick={() => setActiveTab('top')}
              className={`flex-1 py-4 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'top' ? 'text-dash-text-primary border-b-2 border-blue-500' : 'text-dash-text-muted hover:text-dash-text-primary'}`}
            >
              <Activity className={`w-4 h-4 ${activeTab === 'top' ? 'text-purple-500' : ''}`} />
              Top Growth
            </button>
          </div>
          
          {activeTab === 'watchlist' ? (
            <>
              <div className="p-4 border-b border-dash-border bg-dash-bg/50">
                <div ref={searchRef} className="relative">
                  <form onSubmit={handleAddWatchlist} className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center ">
                      <Search className="h-4 w-4 text-dash-text-muted" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search symbol (e.g. RELIANCE)" 
                      className="w-full pl-9 pr-10 h-10 text-[14px] bg-dash-card border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow uppercase" 
                      value={searchSymbol} 
                      onChange={e => {
                        setSearchSymbol(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    <button disabled={addingToWatchlist} type="submit" className="absolute right-2 p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                  
                  {showDropdown && filteredCompanies.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dash-card border border-dash-border rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredCompanies.map(company => (
                        <button
                          type="button"
                          key={company.symbol}
                          className="w-full text-left px-4 py-3 hover:bg-dash-elevated transition-colors border-b border-dash-border/50 last:border-0"
                          onClick={() => {
                            setSearchSymbol(company.symbol);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[14px] text-dash-text-primary">{company.symbol}</span>
                            <span className="text-[13px] text-dash-text-secondary">₹{company.currentPrice?.toLocaleString()}</span>
                          </div>
                          <div className="text-[12px] text-dash-text-muted truncate">{company.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-0 overflow-y-auto max-h-[700px] custom-scrollbar flex-1">
                {loadingWatchlist ? (
                  <p className="text-dash-text-muted text-center py-8 text-[14px]">Loading watchlist...</p>
                ) : enrichedWatchlist.length === 0 ? (
                  <p className="text-dash-text-muted text-center py-10 text-[14px]">Your watchlist is empty.</p>
                ) : (
                  <div className="divide-y divide-dash-border">
                    {enrichedWatchlist.map((company: any) => (
                      <div key={company.symbol} className="flex items-center group relative hover:bg-dash-elevated transition-colors">
                        <button
                          onClick={() => setSelectedSymbol(company.symbol)}
                          className="flex items-center flex-1 px-4 py-4 text-left"
                        >
                          <div className="flex-1">
                            <div className="font-[500] text-[15px] tracking-wide text-dash-text-primary group-hover:text-blue-400 transition-colors uppercase">
                              {company.symbol}
                            </div>
                            <div className="text-[12px] font-medium text-dash-text-muted uppercase mt-0.5 tracking-wider">
                              {company.exchange || 'NSE'}
                            </div>
                          </div>
                          
                          <div className="text-right pr-4 group-hover:pr-10 transition-all duration-200">
                            {loadingPrices || loadingWatchlist ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="h-4 w-16 bg-dash-border/30 rounded animate-pulse"></div>
                                <div className="h-3 w-12 bg-dash-border/30 rounded animate-pulse mt-0.5"></div>
                              </div>
                            ) : (
                              <>
                                <div className={`text-[15px] font-[500] tracking-wide tabular-nums ${company.liveData?.change >= 0 ? 'text-green-500' : company.liveData?.change < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
                                  {(company.liveData?.price || company.currentPrice)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[12px] text-dash-text-muted tabular-nums font-medium mt-0.5">
                                  {company.liveData?.change > 0 ? '+' : ''}{company.liveData?.change?.toFixed(2) || '0.00'} ({company.liveData?.changePercent > 0 ? '+' : ''}{company.liveData?.changePercent?.toFixed(2) || '0.00'}%)
                                </div>
                              </>
                            )}
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => removeFromWatchlist(company.symbol)}
                          className="absolute right-4 opacity-0 group-hover:opacity-100 p-1.5 text-dash-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all duration-200"
                          title="Remove from watchlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-0 overflow-y-auto max-h-[700px] custom-scrollbar flex-1">
              {loadingTop ? <p className="text-dash-text-muted text-center py-8 text-[14px]">Loading companies...</p> : (
                <div className="divide-y divide-dash-border">
                  {enrichedTopCompanies.map((company: any, index: number) => (
                    <button
                      key={company.symbol}
                      onClick={() => setSelectedSymbol(company.symbol)}
                      className="w-full flex items-center px-4 py-4 hover:bg-dash-elevated transition-colors group text-left"
                    >
                      <div className="flex-1">
                        <div className="font-[500] text-[15px] tracking-wide text-dash-text-primary group-hover:text-blue-400 transition-colors uppercase flex items-center gap-2">
                          <span className="text-[11px] font-bold text-dash-text-muted bg-dash-bg px-1.5 py-0.5 rounded">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          {company.symbol}
                        </div>
                        <div className="text-[12px] font-medium text-dash-text-muted uppercase mt-0.5 tracking-wider pl-8">
                          {company.exchange || 'NSE'}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {loadingPrices || loadingTop ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="h-4 w-16 bg-dash-border/30 rounded animate-pulse"></div>
                            <div className="h-3 w-12 bg-dash-border/30 rounded animate-pulse mt-0.5"></div>
                          </div>
                        ) : (
                          <>
                            <div className={`text-[15px] font-[500] tracking-wide tabular-nums ${company.liveData?.change >= 0 ? 'text-green-500' : company.liveData?.change < 0 ? 'text-red-500' : 'text-dash-text-primary'}`}>
                              {(company.liveData?.price || company.currentPrice)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[12px] text-dash-text-muted tabular-nums font-medium mt-0.5">
                              {company.liveData?.change > 0 ? '+' : ''}{company.liveData?.change?.toFixed(2) || '0.00'} ({company.liveData?.changePercent > 0 ? '+' : ''}{company.liveData?.changePercent?.toFixed(2) || '0.00'}%)
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* AI Analysis Modal */}
      {analysisModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dash-card border border-dash-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-dash-border bg-dash-header/50 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-dash-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Fundamentals: {analysisModalData.symbol}
              </h2>
              <button 
                onClick={() => setAnalysisModalData(null)}
                className="text-dash-text-secondary hover:text-dash-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="text-[14px] text-dash-text-primary leading-relaxed prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-ul:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-td:p-2 prose-th:p-2 prose-table:my-2 prose-table:border-collapse">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />
                  }}
                >
                  {analysisModalData.analysis}
                </ReactMarkdown>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-dash-border bg-dash-bg/50 flex justify-end">
              <button 
                onClick={() => setAnalysisModalData(null)}
                className="px-4 py-2 bg-dash-elevated hover:bg-dash-border text-dash-text-primary rounded-lg transition-colors text-[14px] font-medium border border-dash-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* SELL MODAL */}
      {sellModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dash-card border border-dash-border rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-dash-border flex justify-between items-center bg-dash-header">
              <h2 className="text-[16px] font-semibold text-dash-text-primary flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-red-500" />
                Sell {sellModalData.symbol}
              </h2>
              <button 
                onClick={() => setSellModalData(null)}
                className="text-dash-text-muted hover:text-dash-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSellSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-dash-text-secondary mb-2">
                  Units to Sell (Max: {sellModalData.totalShares})
                </label>
                <input 
                  type="number" 
                  step="any"
                  min="0.0001"
                  max={sellModalData.totalShares}
                  required
                  value={sellModalData.sharesToSell}
                  onChange={e => setSellModalData({...sellModalData, sharesToSell: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-dash-bg border border-dash-border rounded-lg text-dash-text-primary focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Enter units"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button"
                  onClick={() => setSellModalData(null)}
                  className="px-4 py-2 bg-dash-elevated hover:bg-dash-border text-dash-text-primary rounded-lg transition-colors text-[14px] font-medium border border-dash-border"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors text-[14px] font-medium border border-red-500/20"
                >
                  Confirm Sell
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
