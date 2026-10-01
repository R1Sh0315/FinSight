import React from 'react';
import { EconomicCalendar, Timeline } from 'react-ts-tradingview-widgets';
import { Globe, Calendar as CalendarIcon, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useGetIndianNewsQuery, useAnalyzeNewsMutation } from '../store/api';

export default function NewsPage() {
  const [theme, setTheme] = React.useState<"dark" | "light">(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const [marketRegion, setMarketRegion] = React.useState<"global" | "india">("global");
  const [analyzingIndex, setAnalyzingIndex] = React.useState<number | null>(null);
  const [analyses, setAnalyses] = React.useState<Record<number, string>>({});

  const { data: indianNewsData, isLoading: loadingIndianNews } = useGetIndianNewsQuery(undefined, { skip: marketRegion !== "india" });
  const [analyzeNews] = useAnalyzeNewsMutation();

  const handleAnalyze = async (e: React.MouseEvent, index: number, title: string, description: string) => {
    e.preventDefault();
    if (analyses[index]) return; // Already analyzed
    
    setAnalyzingIndex(index);
    try {
      const res = await analyzeNews({ title, description }).unwrap();
      setAnalyses(prev => ({ ...prev, [index]: res.data.analysis }));
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzingIndex(null);
    }
  };

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-dash-text-primary flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-blue-500" />
            {marketRegion === 'global' ? 'Global Markets' : 'Indian Markets'} & News
          </h1>
          <p className="text-dash-text-secondary text-[14px]">
            Track major events, macroeconomic indicators, and breaking news that move the markets.
          </p>
        </div>

        <div className="flex bg-dash-card border border-dash-border rounded-lg p-1">
          <button
            onClick={() => setMarketRegion('global')}
            className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${marketRegion === 'global' ? 'bg-blue-500 text-white' : 'text-dash-text-secondary hover:text-dash-text-primary'}`}
          >
            Global
          </button>
          <button
            onClick={() => setMarketRegion('india')}
            className={`px-4 py-2 text-[14px] font-medium rounded-md transition-colors ${marketRegion === 'india' ? 'bg-blue-500 text-white' : 'text-dash-text-secondary hover:text-dash-text-primary'}`}
          >
            India
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Breaking News Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h2 className="text-[16px] font-semibold text-dash-text-primary">Live News Feed</h2>
          </div>
          
          <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden h-[700px] p-2">
            {marketRegion === 'global' ? (
              <Timeline 
                colorTheme={theme} 
                feedMode="all_symbols"
                displayMode="compact"
                isTransparent={false}
                height="100%"
                width="100%"
              />
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar p-2">
                {loadingIndianNews ? (
                  <p className="text-dash-text-muted text-center py-10">Fetching latest Indian market news...</p>
                ) : indianNewsData?.data && indianNewsData.data.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {indianNewsData.data.map((item, index) => (
                      <a 
                        key={index} 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block p-4 rounded-lg bg-dash-bg border border-dash-border/50 hover:border-blue-500/50 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                              {item.source}
                            </span>
                            {item.sentiment === 'positive' && <TrendingUp className="w-4 h-4 text-green-500" />}
                            {item.sentiment === 'negative' && <TrendingDown className="w-4 h-4 text-red-500" />}
                            {item.sentiment === 'neutral' && <Minus className="w-4 h-4 text-dash-text-muted" />}
                          </div>
                          <span className="text-[12px] text-dash-text-muted">
                            {new Date(item.pubDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-dash-text-primary group-hover:text-blue-400 transition-colors mb-2 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-[13px] text-dash-text-secondary line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        
                        {/* AI Analysis Section */}
                        <div onClick={e => e.preventDefault()}>
                          {!analyses[index] && analyzingIndex !== index && (
                            <button 
                              onClick={(e) => handleAnalyze(e, index, item.title, item.description)}
                              className="flex items-center gap-1.5 text-[12px] font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1.5 rounded transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Ask AI to Analyze Impact
                            </button>
                          )}
                          
                          {analyzingIndex === index && (
                            <div className="flex items-center gap-2 text-[12px] text-purple-400 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI is analyzing market impact...
                            </div>
                          )}

                          {analyses[index] && (
                            <div className="mt-3 p-3 bg-dash-elevated rounded-lg border border-purple-500/20 shadow-inner">
                              <div className="flex items-center gap-1.5 mb-2 text-purple-400 font-medium text-[13px]">
                                <Sparkles className="w-4 h-4" /> AI Analysis
                              </div>
                              <div className="text-[13px] text-dash-text-primary leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-headings:mb-1 prose-headings:mt-3 prose-td:p-2 prose-th:p-2 prose-table:my-2 prose-table:border-collapse">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />
                                  }}
                                >
                                  {analyses[index]}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-dash-text-muted text-center py-10">No news available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Economic Calendar */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <CalendarIcon className="w-4 h-4 text-purple-500" />
            <h2 className="text-[16px] font-semibold text-dash-text-primary">Economic Calendar</h2>
          </div>
          
          <div className="bg-dash-card rounded-xl border border-dash-border shadow-sm overflow-hidden h-[700px] p-2">
            <EconomicCalendar 
              colorTheme={theme} 
              isTransparent={false}
              importanceFilter="-1,0,1"
              height="100%"
              width="100%"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
