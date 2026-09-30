import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  useGetCompanyQuery, 
  useGetCompanyFinancialsQuery,
  useGetCompanyForecastQuery 
} from '../store/api';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

export default function CompanyDetailsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  
  const { data: companyData, isLoading: loadingCompany } = useGetCompanyQuery(symbol || '');
  const { data: finData, isLoading: loadingFin } = useGetCompanyFinancialsQuery(symbol || '');
  
  const [shouldFetchForecast, setShouldFetchForecast] = React.useState(false);
  const { data: forecastData, isLoading: loadingForecast, error: forecastError } = useGetCompanyForecastQuery(symbol || '', {
    skip: !shouldFetchForecast
  });

  if (loadingCompany || loadingFin) return <div className="text-center py-10 text-dash-text-muted">Loading details...</div>;
  
  const company = companyData?.data;
  const financials = finData?.data;

  // Use TradingView theme depending on dark mode state
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/" className="inline-flex items-center text-[14px] text-dash-text-secondary hover:text-blue-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
      
      {company ? (
        <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm p-6 mb-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-[24px] font-bold text-dash-text-primary mb-1">{company.name} <span className="text-dash-text-secondary font-medium">({company.symbol})</span></h1>
              <p className="text-dash-text-secondary text-[14px]">Exchange: {company.exchange || 'BSE'}</p>
            </div>
            <div className="text-right">
              <p className="text-[28px] font-bold text-dash-text-primary">₹{company.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* TradingView Advanced Chart */}
          <div className="h-[450px] border border-dash-border rounded-lg overflow-hidden mb-8">
            <AdvancedRealTimeChart 
              symbol={`BSE:${company.symbol}`} 
              theme={isDark ? "dark" : "light"}
              autosize 
              hide_side_toolbar={false}
              allow_symbol_change={false}
              details={true}
              hotlist={false}
              calendar={false}
            />
          </div>
          
          <h2 className="text-[18px] font-semibold text-dash-text-primary mb-4 border-b border-dash-border pb-3">Financial Snapshot</h2>
          {financials ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-dash-elevated rounded-lg border border-dash-border/50">
                <p className="text-[13px] text-dash-text-secondary mb-1">Revenue</p>
                <p className="font-semibold text-dash-text-primary">₹{financials.revenue?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-dash-elevated rounded-lg border border-dash-border/50">
                <p className="text-[13px] text-dash-text-secondary mb-1">Net Income</p>
                <p className="font-semibold text-dash-text-primary">₹{financials.netIncome?.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-dash-elevated rounded-lg border border-dash-border/50">
                <p className="text-[13px] text-dash-text-secondary mb-1">P/E Ratio</p>
                <p className="font-semibold text-dash-text-primary">{financials.peRatio}</p>
              </div>
              <div className="p-4 bg-dash-elevated rounded-lg border border-dash-border/50">
                <p className="text-[13px] text-dash-text-secondary mb-1">Debt/Equity</p>
                <p className="font-semibold text-dash-text-primary">{financials.debtToEquity}</p>
              </div>
            </div>
          ) : (
            <p className="text-dash-text-muted text-[14px] mb-8">No financial data available.</p>
          )}

          <div className="mt-8 pt-6 border-t border-dash-border">
            <h2 className="text-[18px] font-semibold text-dash-text-primary mb-4 flex items-center gap-2">
              <BrainCircuit className="text-purple-500 w-5 h-5" />
              AI Future Growth Forecast
            </h2>
            
            {!shouldFetchForecast ? (
              <button 
                onClick={() => setShouldFetchForecast(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-[14px]"
              >
                Generate AI Forecast (Llama 3)
              </button>
            ) : loadingForecast ? (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg animate-pulse text-[14px]">
                Analyzing financial data and market conditions with AI...
              </div>
            ) : forecastError ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[14px]">
                Failed to generate forecast. (Did you set the AI_API_KEY?)
              </div>
            ) : forecastData ? (
              <div className="p-6 bg-dash-elevated rounded-lg border border-dash-border prose prose-invert prose-purple max-w-none text-[15px] leading-relaxed">
                <ReactMarkdown>{forecastData.data.forecast}</ReactMarkdown>
              </div>
            ) : null}
          </div>

        </div>
      ) : (
        <p className="text-dash-text-muted">Company not found.</p>
      )}
    </div>
  );
}
