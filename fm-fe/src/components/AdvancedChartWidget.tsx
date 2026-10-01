import { useEffect, useRef, memo } from 'react';

interface AdvancedChartWidgetProps {
  defaultSymbol?: string;
}

function AdvancedChartWidget({ defaultSymbol = "BSE:RELIANCE" }: AdvancedChartWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any existing script to prevent duplicates
    container.current.innerHTML = '';
    
    const isDark = document.documentElement.classList.contains('dark');

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    const config = {
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": defaultSymbol,
      "theme": isDark ? "dark" : "light",
      "timezone": "Etc/UTC",
      "backgroundColor": isDark ? "#151F30" : "#FFFFFF",
      "gridColor": isDark ? "rgba(242, 242, 242, 0.06)" : "rgba(0, 0, 0, 0.06)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "support_host": "https://www.tradingview.com",
      "studies": [],
      "autosize": true
    };

    script.innerHTML = JSON.stringify(config);
    container.current.appendChild(script);
  }, [defaultSymbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}></div>
  );
}

export default memo(AdvancedChartWidget);
