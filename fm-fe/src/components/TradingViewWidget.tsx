import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbols: [string, string][]; // e.g. [["Apple", "NASDAQ:AAPL|1D"]]
}

function TradingViewWidget({ symbols }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any existing script to prevent duplicates when symbols change
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Determine theme from document class
    const isDark = document.documentElement.classList.contains('dark');
    
    const config = {
      "lineWidth": 2,
      "lineType": 0,
      "chartType": "area",
      "fontColor": "rgb(106, 109, 120)",
      "gridLineColor": "rgba(242, 242, 242, 0.06)",
      "volumeUpColor": "rgba(34, 171, 148, 0.5)",
      "volumeDownColor": "rgba(247, 82, 95, 0.5)",
      "backgroundColor": "#151F30",
      "widgetFontColor": "#F8FAFC",
      "upColor": "#22ab94",
      "downColor": "#f7525f",
      "borderUpColor": "#22ab94",
      "borderDownColor": "#f7525f",
      "wickUpColor": "#22ab94",
      "wickDownColor": "#f7525f",
      "colorTheme": "dark",
      "isTransparent": true,
      "locale": "en",
      "chartOnly": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "symbols": symbols.length > 0 ? symbols : [["TCS", "BSE:TCS|1D"]],
      "dateRanges": [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ],
      "fontSize": "10",
      "headerFontSize": "medium",
      "autosize": true,
      "width": "100%",
      "height": "100%",
      "noTimeScale": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false
    };

    script.innerHTML = JSON.stringify(config);
    container.current.appendChild(script);
    
  }, [symbols]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}></div>
  );
}

export default memo(TradingViewWidget);
