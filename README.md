# FinSight

FinSight is an AI-powered financial market intelligence platform featuring real-time data analysis, stock screening, intelligent forecasting, and portfolio planning with support for Indian equities, mutual funds, and forex trading.

## 🚀 Features

- **Dashboard**: Real-time market visualization utilizing advanced TradingView charts.
- **Stock Screener**: Automated screening tools to filter the market for optimal investments.
- **Forex Trading**: Live forex rates for major pairs (EURUSD, GBPUSD, USDINR, etc.) with economic impact analysis.
- **AI-Powered Insights**: Integrated with Groq LLMs to generate intelligent financial market summaries, news sentiment analysis, and forecasting.
- **Systematic Investment Plan (SIP) Engine**: Tools to plan, track, and forecast your SIPs.
- **Market News**: Real-time aggregation from 5+ Indian and 4+ global financial news sources.
- **Economic Calendar**: Track global economic events impacting forex and equity markets.
- **Google Authentication**: Secure login and portfolio tracking using Google OAuth.
- **No Mock Data**: Production-ready with all real data sources (Yahoo Finance, Screener.in, mfapi.in, News APIs).

## 🛠️ Tech Stack

### Frontend (`fm-fe`)
- **Framework**: React 19 with Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Components**: Lucide React, TradingView Widgets, React Markdown

### Backend (`fm-be`)
- **Runtime**: Node.js & Express
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Groq SDK
- **Data Ingestion**: Yahoo Finance API, Cheerio (Web Scraping), RSS Parser
- **Authentication**: JWT, Google Auth Library

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance
- API Keys: Groq, Google OAuth Client ID

### 1. Backend Setup
```bash
cd fm-be
npm install
# Create a .env file with your MongoDB URI, Groq API Key, and Google Auth secrets
npm run dev
```

### 2. Frontend Setup
```bash
cd fm-fe
npm install
# Create a .env file with your VITE_API_URL and Google Client ID
npm run dev
```

## 📝 License
This project is licensed under the MIT License.
