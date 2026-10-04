import React, { useState, useMemo } from 'react';
import { useGetCommonForexPairsQuery, useGetForexRatesQuery } from '../store/api';
import { TrendingUp, TrendingDown, Search, Loader2 } from 'lucide-react';
import TradingViewWidget from '../components/TradingViewWidget';

export default function ForexDashboardPage() {
  const { data: forexPairsData, isLoading: loadingPairs } = useGetCommonForexPairsQuery();
  const commonPairs = forexPairsData?.commonPairs || [];

  const [selectedPairs, setSelectedPairs] = useState<string[]>(['EURUSD', 'GBPUSD']);
  const pairsString = selectedPairs.length > 0 ? selectedPairs.join(',') : 'EURUSD,GBPUSD';
  const { data: ratesData, isLoading: loadingRates, error: ratesError } = useGetForexRatesQuery(pairsString);

  const rates = ratesData?.data || [];

  // Calculate top movers (gainers and losers)
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...rates].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
    return {
      topGainers: sorted.slice(0, 3),
      topLosers: sorted.slice(-3).reverse()
    };
  }, [rates]);

  const handlePairSelect = (pair: string) => {
    setSelectedPairs(prev =>
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  // Format TradingView symbols for charts
  const chartSymbols: [string, string][] = selectedPairs.map(pair => [pair, `FX:${pair}|1D`]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dash-text-primary mb-2">Forex Dashboard</h1>
        <p className="text-dash-text-secondary text-sm">Live forex rates, top movers, and market insights</p>
      </div>

      {/* Top Movers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-dash-elevated rounded-lg border border-dash-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-dash-text-primary">Top Gainers</h2>
          </div>

          {loadingRates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
            </div>
          ) : topGainers.length === 0 ? (
            <p className="text-dash-text-secondary text-sm py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {topGainers.map((rate) => (
                <div key={rate.pair} className="flex items-center justify-between p-3 bg-dash-bg rounded-lg border border-dash-border hover:border-green-500 transition-colors cursor-pointer" onClick={() => handlePairSelect(rate.pair)}>
                  <div>
                    <p className="font-semibold text-dash-text-primary">{rate.pair}</p>
                    <p className="text-xs text-dash-text-secondary">{rate.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-dash-text-primary">{rate.rate.toFixed(4)}</p>
                    <p className="text-sm font-semibold text-green-500">+{rate.changePercent?.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Losers */}
        <div className="bg-dash-elevated rounded-lg border border-dash-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-dash-text-primary">Top Losers</h2>
          </div>

          {loadingRates ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
            </div>
          ) : topLosers.length === 0 ? (
            <p className="text-dash-text-secondary text-sm py-4">No data available</p>
          ) : (
            <div className="space-y-3">
              {topLosers.map((rate) => (
                <div key={rate.pair} className="flex items-center justify-between p-3 bg-dash-bg rounded-lg border border-dash-border hover:border-red-500 transition-colors cursor-pointer" onClick={() => handlePairSelect(rate.pair)}>
                  <div>
                    <p className="font-semibold text-dash-text-primary">{rate.pair}</p>
                    <p className="text-xs text-dash-text-secondary">{rate.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-dash-text-primary">{rate.rate.toFixed(4)}</p>
                    <p className="text-sm font-semibold text-red-500">{rate.changePercent?.toFixed(2)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Pairs Section */}
      <div className="bg-dash-elevated rounded-lg border border-dash-border p-6">
        <h2 className="text-lg font-bold text-dash-text-primary mb-4">Select Pairs</h2>

        {loadingPairs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {commonPairs.map((pair) => (
              <button
                key={pair}
                onClick={() => handlePairSelect(pair)}
                className={`p-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  selectedPairs.includes(pair)
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-dash-bg border border-dash-border text-dash-text-primary hover:border-blue-500'
                }`}
              >
                {pair}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      {selectedPairs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-dash-text-primary">Price Charts</h2>

          {chartSymbols.map((symbol) => (
            <div key={symbol[0]} className="bg-dash-elevated rounded-lg border border-dash-border p-4 overflow-hidden">
              <h3 className="text-base font-semibold text-dash-text-primary mb-4">{symbol[0]}</h3>
              <div className="h-96 w-full">
                <TradingViewWidget symbols={[symbol]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Rates Table */}
      <div className="bg-dash-elevated rounded-lg border border-dash-border p-6">
        <h2 className="text-lg font-bold text-dash-text-primary mb-4">All Rates</h2>

        {loadingRates ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-dash-text-secondary" />
          </div>
        ) : ratesError ? (
          <div className="text-red-500 text-sm p-4 bg-red-500/10 rounded-lg">
            Failed to load forex rates. Please try again later.
          </div>
        ) : rates.length === 0 ? (
          <p className="text-dash-text-secondary text-sm py-4">No rates available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-dash-border">
                <tr>
                  <th className="text-left px-4 py-3 text-dash-text-secondary text-sm font-semibold">Pair</th>
                  <th className="text-right px-4 py-3 text-dash-text-secondary text-sm font-semibold">Rate</th>
                  <th className="text-right px-4 py-3 text-dash-text-secondary text-sm font-semibold">Change</th>
                  <th className="text-right px-4 py-3 text-dash-text-secondary text-sm font-semibold">Change %</th>
                  <th className="text-left px-4 py-3 text-dash-text-secondary text-sm font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.pair} className="border-b border-dash-border hover:bg-dash-bg transition-colors">
                    <td className="px-4 py-3 font-semibold text-dash-text-primary">{rate.pair}</td>
                    <td className="px-4 py-3 text-right font-mono text-dash-text-primary">{rate.rate.toFixed(4)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${rate.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {rate.change >= 0 ? '+' : ''}{rate.change?.toFixed(4)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${rate.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {rate.changePercent >= 0 ? '+' : ''}{rate.changePercent?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-dash-text-secondary">{rate.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          💡 <strong>Tip:</strong> Click on any pair to add it to the charts above. Forex markets are open 24/5 (Monday-Friday). Data is refreshed every few minutes from Yahoo Finance.
        </p>
      </div>
    </div>
  );
}
