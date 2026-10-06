import { Request, Response } from "express";
import yahooFinanceDefault from 'yahoo-finance2';

// In newer versions of yahoo-finance2, the default export is a class that needs to be instantiated
const yahooFinance = new (yahooFinanceDefault as any)();

export const getLivePrices = async (req: Request, res: Response) => {
  try {
    const { symbols } = req.query;
    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({ message: "No symbols provided" });
    }

    const symbolArray = symbols.split(',');
    
    // Separate into MF and Equity
    const mfSymbols = symbolArray.filter(sym => /^\d+$/.test(sym));
    const eqSymbols = symbolArray.filter(sym => !/^\d+$/.test(sym));

    const prices: any = {};

    // 1. Fetch Equities from Yahoo
    if (eqSymbols.length > 0) {
      try {
        const results = await yahooFinance.quote(eqSymbols);
        results.forEach((quote: any) => {
          prices[quote.symbol] = {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          };
        });
      } catch (err) {
        console.warn("Yahoo Finance fetch error:", err);
      }
    }

    // 2. Fetch Mutual Funds from mfapi.in
    if (mfSymbols.length > 0) {
      await Promise.all(mfSymbols.map(async (code) => {
        try {
          const response = await fetch(`https://api.mfapi.in/mf/${code}`);
          const data = await response.json();
          if (data && data.data && data.data.length > 0) {
            const latest = data.data[0]; // Most recent NAV
            prices[code] = {
              price: parseFloat(latest.nav),
              change: 0, // mfapi doesn't give direct change easily without comparing to data[1], maybe we can just calculate it
              changePercent: 0
            };
            if (data.data.length > 1) {
              const previous = data.data[1];
              const change = prices[code].price - parseFloat(previous.nav);
              prices[code].change = change;
              prices[code].changePercent = (change / parseFloat(previous.nav)) * 100;
            }
          }
        } catch (err) {
          console.warn(`MF API fetch error for ${code}:`, err);
        }
      }));
    }

    res.json({ data: prices });
  } catch (error) {
    console.error("Failed to fetch live prices:", error);
    res.status(500).json({ message: "Failed to fetch live prices" });
  }
};

import Groq from 'groq-sdk';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['description', 'pubDate', 'link', 'title']
  }
});

// Basic keyword-based sentiment analyzer for fast list rendering
const analyzeSentimentFast = (text: string): 'positive' | 'negative' | 'neutral' => {
  const lowerText = text.toLowerCase();
  const positiveWords = ['surge', 'jump', 'rally', 'gain', 'rise', 'soar', 'profit', 'up ', 'bull', 'growth', 'dividend', 'breakout', 'record high', 'buy', 'inflow'];
  const negativeWords = ['dip', 'fall', 'drop', 'plunge', 'loss', 'lose', 'losing', 'sell', 'bear', 'crash', 'down', 'weak', 'slump', 'streak', 'outflow', 'fear'];
  
  let score = 0;
  positiveWords.forEach(w => { if (lowerText.includes(w)) score += 1; });
  negativeWords.forEach(w => { if (lowerText.includes(w)) score -= 1; });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

export const getIndianNews = async (req: Request, res: Response) => {
  try {
    const feeds = [
      { url: 'https://www.moneycontrol.com/rss/business.xml', source: 'Moneycontrol' },
      { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/2146842.cms', source: 'Economic Times' },
      { url: 'https://www.livemint.com/rss/markets', source: 'LiveMint' },
      { url: 'https://feeds.business-standard.com/markets/', source: 'Business Standard' },
      { url: 'https://bsense.tickertape.in/rss.xml', source: 'Tickertape' }
    ];

    const allNewsPromises = feeds.map(async (feedInfo) => {
      try {
        const feed = await parser.parseURL(feedInfo.url);
        return feed.items.map(item => {
          const desc = item.description?.replace(/<[^>]*>?/gm, '') || '';
          const title = item.title || '';
          return {
            title,
            link: item.link,
            description: desc,
            pubDate: item.pubDate,
            source: feedInfo.source,
            sentiment: analyzeSentimentFast(title + " " + desc)
          };
        });
      } catch (e) {
        console.error(`Failed to fetch from ${feedInfo.source}:`, e);
        return [];
      }
    });

    const results = await Promise.all(allNewsPromises);
    let allNews = results.flat();
    
    allNews.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ data: allNews.slice(0, 30) });
  } catch (error) {
    console.error("Failed to fetch Indian news:", error);
    res.status(500).json({ message: "Failed to fetch Indian news" });
  }
};

export const getGlobalNews = async (req: Request, res: Response) => {
  try {
    // Global financial news sources including forex
    const feeds = [
      { url: 'https://feeds.bloomberg.com/markets/news.rss', source: 'Bloomberg Markets' },
      { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters Business' },
      { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC' },
      { url: 'https://feeds.finance.yahoo.com/', source: 'Yahoo Finance' }
    ];

    const allNewsPromises = feeds.map(async (feedInfo) => {
      try {
        const feed = await parser.parseURL(feedInfo.url);
        return feed.items.slice(0, 5).map(item => {
          const desc = item.description?.replace(/<[^>]*>?/gm, '') || '';
          const title = item.title || '';
          return {
            title,
            link: item.link,
            description: desc,
            pubDate: item.pubDate,
            source: feedInfo.source,
            sentiment: analyzeSentimentFast(title + " " + desc),
            category: 'Global Markets'
          };
        });
      } catch (e) {
        console.error(`Failed to fetch from ${feedInfo.source}:`, e);
        return [];
      }
    });

    const results = await Promise.all(allNewsPromises);
    let allNews = results.flat();

    allNews.sort((a, b) => {
      const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ data: allNews.slice(0, 20) });
  } catch (error) {
    console.error("Failed to fetch global news:", error);
    res.status(500).json({ message: "Failed to fetch global news" });
  }
};

export const analyzeNewsWithAI = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "News title is required" });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error("AI_API_KEY is not configured in .env");
    }
    
    const groq = new Groq({ apiKey });

    const prompt = `
You are an expert financial analyst for the Indian stock market.
Analyze the following news headline and brief description.
Headline: ${title}
Description: ${description || 'N/A'}

Please provide:
1. The **Overall Sentiment** (e.g. **Bullish**, **Bearish**, or **Neutral**).
2. 2-3 specific **Indian stocks or sectors** (e.g. **Nifty Bank**, **TCS**, **Tata Motors**) that will be most directly impacted.
3. A brief explanation of *how* and *why* they will be impacted.

Use Markdown to **bold** all stock names, sector names, and key financial terms to make the response highly readable. Keep it concise.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant',
      temperature: 0.3,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || "No analysis generated.";
    
    res.json({ data: { analysis } });
  } catch (error: any) {
    console.error("Failed to analyze news with AI. Detailed error:", error.message || error);
    if (error.response) {
      console.error(error.response.data);
    }
    res.status(500).json({ message: "Failed to analyze news with AI", error: error.message || "Unknown error" });
  }
};

export const analyzeCompanyWithAI = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: "Company symbol is required" });

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new Error("AI_API_KEY is not configured in .env");
    
    const groq = new Groq({ apiKey });

    // Comprehensive analysis prompt
    const prompt = `
# Comprehensive Company Annual Report & Investment Analysis

**CRITICAL INSTRUCTION: Due to output length limits, you MUST be extremely concise. Provide bullet points and tables only. Do not write long paragraphs. Keep the entire report under 1,500 words while covering all requested sections.**

Analyze **${symbol}** as an equity investor.

## Objective
Read and analyze the **latest 3 Annual Reports** available for the company. If available, also examine the latest quarterly/financial results and current market data.
Do not rely on summaries alone. Use the company's original Annual Reports, financial statements, investor presentations, exchange filings, and other primary sources wherever possible.
Clearly mention the **financial year/date** for every financial metric and the **source**.

---
# 1. Company Overview
Start with:
* Company name
* Ticker
* Industry
* Business model
* Main products/services
* Major geographical markets
* Major customer/segment exposure
* Subsidiaries
* Promoter/shareholding structure
* Market capitalization
* Current share price
* Face value
* Total shares outstanding

Explain in simple language how the company makes money.

---
# 2. Financial Parameters
Create a **3-year and 5-year trend wherever data is available**.

Show:
### Revenue
* Revenue
* YoY revenue growth
* 3Y CAGR
* 5Y CAGR

### Profitability
* EBITDA
* EBITDA margin
* EBIT
* EBIT margin
* PAT / Net Profit
* Net profit margin
* YoY profit growth
* EPS
* EPS growth

### Cash Flow
* Operating Cash Flow
* Capital Expenditure
* Free Cash Flow
* OCF / PAT
* FCF / PAT
Explain whether accounting profits are being converted into actual cash.

### Balance Sheet
* Total assets
* Net worth
* Total debt
* Net debt
* Cash & equivalents
* Investments
* Current assets
* Current liabilities
* Receivables
* Payables
* Working capital

Calculate:
* Debt/Equity
* Net Debt/EBITDA
* Current Ratio
* Quick Ratio

---
# 3. Return & Efficiency Ratios
Calculate and explain:
* ROE
* ROCE
* ROA
* Asset Turnover
* Capital Turnover
* Working Capital Turnover

Show the trend for at least 3 years.
Explain whether returns are improving, deteriorating, or remaining stable.

---
# 4. Valuation
Use the **latest available market price and market data**, separately from the Annual Report.

Calculate:
* P/E
* Forward P/E if reliable estimates are available
* P/B
* EV/EBITDA
* EV/Sales
* Price/Sales
* Dividend Yield
* Earnings Yield
* FCF Yield
* PEG ratio if meaningful

Also compare the company with relevant competitors/industry peers.
For every valuation metric, provide:
**Current value → historical average → peer comparison → interpretation**
Do NOT call the stock cheap or expensive without explaining the underlying numbers.
Clearly state the **market-data date** used.

---
# 5. Dividend & Capital Allocation
Analyze:
* Dividend per share
* Dividend payout ratio
* Dividend CAGR
* Buybacks
* Share dilution
* Retained earnings
* Acquisition spending
* Capital expenditure
* Cash utilization
Evaluate how management has allocated shareholder capital historically.

---
# 6. Business Segment Analysis
Break down revenue and profitability by:
* Business segment
* Geography
* Product/service category

Identify:
* Fastest-growing segment
* Slowest-growing segment
* Largest revenue contributor
* Most profitable segment
* Geographic concentration
Show how this changed over the last 3 years.

---
# 7. Customer Analysis
Analyze:
* Customer concentration
* Top customers if disclosed
* Revenue contribution from major customers
* Customer retention
* Large contracts/deals
* Order book / TCV if applicable
* Book-to-bill if available

For IT/service companies, specifically analyze:
* Deal wins
* Large deals
* Utilization
* Attrition
* Revenue per employee
* Employee count
* Subcontractor expenses

---
# 8. Management Analysis
Analyze management commentary from the last 3 Annual Reports.
Identify:
* Major growth opportunities
* Management's expectations
* Major challenges
* Industry trends
* AI impact
* Technology changes
* Pricing pressure
* Cost pressure
* Margin expectations
* Hiring plans
* Capital allocation plans

Separate:
**FACT → MANAGEMENT CLAIM → INDEPENDENT EVIDENCE**
Do not automatically accept management guidance as fact.

---
# 9. Competitive Position
Analyze:
* Main competitors
* Market position
* Competitive advantages
* Switching costs
* Brand strength
* Pricing power
* Customer relationships
* Technology capabilities
* Scale advantages
* Cost advantages
Explain what could cause the company to lose its competitive position.

---
# 10. Risk Analysis
Identify ALL material risks mentioned in the Annual Reports.
Categorize them into:
### Business Risk
### Financial Risk
### Operational Risk
### Technology Risk
### AI/Automation Risk
### Regulatory Risk
### Geopolitical Risk
### Currency Risk
### Customer Concentration Risk
### Employee/Attrition Risk
### Governance Risk
### Valuation Risk

For each risk explain:
**Risk → Evidence → Potential impact → What investors should monitor**
Do not exaggerate risks.

---
# 11. Governance Analysis
Check:
* Auditor opinion
* Key Audit Matters
* Auditor changes
* Related-party transactions
* Promoter pledging
* Insider transactions if available
* Executive compensation
* Board composition
* Independent directors
* Contingent liabilities
* Pending legal cases
* Regulatory investigations
* Accounting policy changes
* Any qualified opinions
Highlight anything unusual.

---
# 12. Annual Report Red Flags
Specifically search for:
* Falling cash flow
* Profit manipulation indicators
* Rising receivables
* Rising debt
* Margin deterioration
* Excessive acquisitions
* Goodwill increase
* Large contingent liabilities
* Related-party transactions
* Auditor concerns
* Promoter pledge
* Share dilution
* Declining ROE/ROCE
* Declining EPS
* Customer concentration
* Increasing employee costs
* Declining utilization
* Increasing attrition
* Weak order growth
For every red flag provide evidence and the relevant financial year.

---
# 13. PROS
List the company's major strengths.
For every point provide:
**Point → Evidence → Why it matters**
Do not use generic statements.

---
# 14. CONS
List the company's major weaknesses.
For every point provide:
**Point → Evidence → Why it matters**
Include both short-term and long-term concerns.

---
# 15. 3-Year Financial Comparison
Create a clean comparison:
| Parameter           | FY-3 | FY-2 | FY-1 | Trend |
| ------------------- | ---: | ---: | ---: | ----- |
| Revenue             |      |      |      |       |
| Revenue Growth      |      |      |      |       |
| EBITDA              |      |      |      |       |
| EBITDA Margin       |      |      |      |       |
| Net Profit          |      |      |      |       |
| Net Margin          |      |      |      |       |
| EPS                 |      |      |      |       |
| Operating Cash Flow |      |      |      |       |
| Free Cash Flow      |      |      |      |       |
| ROE                 |      |      |      |       |
| ROCE                |      |      |      |       |
| Debt                |      |      |      |       |
| Cash                |      |      |      |       |
| Dividend            |      |      |      |       |

---
# 16. Valuation Snapshot
Create:
| Metric         | Current | Historical | Peer/Industry | Interpretation |
| -------------- | ------: | ---------: | ------------: | -------------- |
| P/E            |         |            |               |                |
| P/B            |         |            |               |                |
| EV/EBITDA      |         |            |               |                |
| EV/Sales       |         |            |               |                |
| Dividend Yield |         |            |               |                |
| FCF Yield      |         |            |               |                |
| PEG            |         |            |               |                |
Clearly identify the date of current market data.

---
# 17. Scenario Analysis
Create three scenarios:
### Bear Case
Explain:
* What could go wrong?
* Expected business impact
* Which metrics would deteriorate?
* What investors should monitor
### Base Case
Explain:
* Reasonable business assumptions
* Revenue growth assumptions
* Margin assumptions
* Earnings assumptions
### Bull Case
Explain:
* Potential growth drivers
* Margin expansion opportunities
* New business opportunities
* Possible catalysts
Do NOT present these as guaranteed outcomes.

---
# 18. Investment Decision Framework
Based strictly on the evidence, summarize:
### Business Quality
Explain the underlying business quality without assigning a numerical score.
### Financial Health
Explain the balance sheet, cash flow and profitability.
### Growth
Explain historical growth and identifiable future growth drivers.
### Valuation
Explain whether the current valuation is consistent with the company's growth, profitability and risks.
### Risks
List the most important risks investors should monitor.

Then provide a **conditional investment conclusion**, not a blind recommendation.
For example:
* What conditions would make the company attractive?
* What conditions would make it unattractive?
* At what valuation/range would further investigation be warranted?
* What financial or business developments would invalidate the thesis?
Do not claim certainty.

---
# 19. Investment Strategy
Instead of simply saying "BUY" or "DON'T BUY", construct a strategy based on valuation and risk.
Discuss:
### Lump Sum
When it may make sense and what risks exist.
### SIP / Staggered Buying
Explain whether spreading purchases over multiple periods could reduce entry-timing risk.
### Valuation-Based Entry
Identify valuation levels or ranges worth monitoring using:
* Historical P/E
* Historical FCF yield
* Earnings growth
* Peer valuation
Do NOT invent price targets.
### Position Sizing
Explain how an investor could think about position sizing based on:
* Portfolio size
* Risk tolerance
* Concentration
* Business risk
* Valuation risk
Do not assume the investor's risk tolerance.
### Exit / Review Conditions
Specify objective conditions under which an investor should reconsider the thesis, such as:
* Sustained revenue deterioration
* Structural margin decline
* ROCE deterioration
* Weak cash conversion
* Rising debt
* Governance issues
* Loss of competitive advantage
* Material deterioration in industry conditions

---
# 20. FINAL SUMMARY
Finish with exactly this structure:
## Company
${symbol}
## Current Valuation
[Key valuation metrics + date]
## Financial Health
[Summary]
## Growth
[Summary]
## Cash Flow
[Summary]
## Balance Sheet
[Summary]
## Major Strengths
* ...
## Major Risks
* ...
## Key Things to Monitor
* ...
## Investment View
Give a balanced evidence-based conclusion explaining the circumstances under which an investment case becomes stronger or weaker.
## Possible Strategy
Explain:
* Lump sum considerations
* Staggered buying
* Valuation considerations
* Position sizing considerations
* Review/exit conditions

---
# 21. DUMMY EXAMPLE
After completing the real company analysis, create a **clearly fictional dummy example** showing what a final investor report could look like.
Use completely fictional numbers and label it:
**"DUMMY EXAMPLE — NOT REAL DATA"**
Example:
Revenue: ₹50,000 Cr
Revenue CAGR: 12%
Net Profit: ₹9,000 Cr
ROE: 24%
ROCE: 31%
Debt/Equity: 0.05
OCF/PAT: 96%
P/E: 24x
P/B: 6x
Dividend Yield: 1.8%
Then demonstrate how these numbers would be interpreted.
Do NOT present dummy numbers as actual company data.

---
# 22. FINAL VERDICT: TO INVEST OR NOT?
End the entire report with a definitive, highly-opinionated **"YES"** or **"NO"** summary based on the aggregate parameters. 
Provide:
1. **The Verdict:** (e.g. YES, NO, or WAIT).
2. **Ideal Entry Time/Horizon:** How long should an investor hold this? 
3. **Ideal Entry Price Range:** Provide a specific realistic valuation range (e.g. "Wait for a dip to ₹XXX - ₹YYY" or "Current P/E of 15x is a strong entry zone").
4. **Why:** A 2-sentence blunt justification.

---
# SOURCE REQUIREMENTS
For every important factual claim:
1. Cite the original Annual Report/page where possible.
2. Cite the company's investor presentation or exchange filing where relevant.
3. For current price/valuation, cite the market-data source and date.
4. Distinguish historical financial data from current market data.
5. Do not use outdated data as current data.
6. Do not invent missing figures.
7. If a metric cannot be calculated reliably, say **"Not available / insufficient data"**.
8. Show the calculation formula whenever you calculate a ratio.
9. Clearly distinguish:
   * Reported facts
   * Calculated metrics
   * Management statements
   * Analyst interpretation
   * Assumptions
The analysis should be detailed enough that an investor can independently verify every major conclusion.

# Standardized Accounting & Calculation Rules
Use the following formulas consistently across all companies and all financial years.
## 1. Growth Metrics
### Revenue Growth
**Revenue Growth % = (Current Year Revenue − Previous Year Revenue) / Previous Year Revenue × 100**
### Net Profit Growth
**Net Profit Growth % = (Current Year PAT − Previous Year PAT) / Previous Year PAT × 100**
### EPS Growth
**EPS Growth % = (Current Year EPS − Previous Year EPS) / Previous Year EPS × 100**
### CAGR
For a period of N years:
**CAGR = [(Ending Value / Beginning Value)^(1/N) − 1] × 100**
Always specify the exact period used.

---
# 2. Profitability
### EBITDA
Use the company's reported EBITDA where available.
If it must be calculated:
**EBITDA = EBIT + Depreciation & Amortization**
Do not mix adjusted EBITDA with reported EBITDA. Clearly label any adjusted figure.
### EBITDA Margin
**EBITDA Margin = EBITDA / Revenue × 100**
### EBIT Margin
**EBIT Margin = EBIT / Revenue × 100**
### Net Profit Margin
**Net Profit Margin = PAT / Revenue × 100**
Use consolidated figures for the primary analysis unless there is a specific reason to use standalone figures.

---
# 3. Cash Flow
### Operating Cash Flow / PAT
**OCF/PAT = Operating Cash Flow / PAT × 100**
Use cash flow from operating activities from the Cash Flow Statement.
### Free Cash Flow
Primary definition:
**FCF = Cash Flow from Operations − Capital Expenditure**
Use actual cash capital expenditure where available.
If the company reports a different FCF definition, show both:
**Company-reported FCF**
and
**Standardized FCF**
Do not silently substitute one definition for another.
### FCF Margin
**FCF Margin = FCF / Revenue × 100**
### FCF Yield
**FCF Yield = FCF / Market Capitalization × 100**
Use the market capitalization corresponding to the stated valuation date.

---
# 4. Return Ratios
## ROE — Return on Equity
Primary formula:
**ROE = PAT / Average Shareholders' Equity × 100**
Where:
**Average Equity = (Beginning Equity + Ending Equity) / 2**
Use average equity rather than ending equity when both years are available.
State clearly if a different company-reported ROE is being used.
## ROCE — Return on Capital Employed
Use:
**ROCE = EBIT / Average Capital Employed × 100**
Where:
**Capital Employed = Total Assets − Current Liabilities**
and:
**Average Capital Employed = (Beginning Capital Employed + Ending Capital Employed) / 2**
If the company's reporting convention differs, show the convention used.
## ROA
**ROA = PAT / Average Total Assets × 100**

---
# 5. Leverage & Solvency
## Debt/Equity
**Debt/Equity = Total Interest-Bearing Debt / Shareholders' Equity**
Clearly distinguish:
* Gross debt
* Net debt
* Lease liabilities
Do not automatically include every liability as "debt."
## Net Debt
**Net Debt = Total Interest-Bearing Debt − Cash & Cash Equivalents**
If investments are included in net debt, explicitly state that alternative definition.
## Net Debt/EBITDA
**Net Debt/EBITDA = Net Debt / EBITDA**
If net debt is negative, report it as **net cash**, rather than forcing a misleading negative leverage interpretation.

---
# 6. Liquidity
## Current Ratio
**Current Ratio = Current Assets / Current Liabilities**
## Quick Ratio
Use:
**Quick Ratio = (Cash + Cash Equivalents + Short-Term Investments + Trade Receivables) / Current Liabilities**
If the annual report does not provide enough information, state that the ratio cannot be reliably calculated.

---
# 7. Valuation
Use the latest available market data and clearly state the date/time.
## Market Capitalization
**Market Cap = Current Share Price × Diluted Shares Outstanding**
Use diluted shares where appropriate.
## P/E
**P/E = Market Price per Share / Diluted EPS**
Prefer trailing twelve-month (TTM) EPS for current valuation unless explicitly analyzing forward valuation.
Clearly label:
* TTM P/E
* Forward P/E
Never mix them.
## Earnings Yield
**Earnings Yield = EPS / Share Price × 100**
Equivalent to:
**Earnings Yield = 1 / P/E × 100**
when the same EPS and price are used.
## P/B
**P/B = Market Capitalization / Book Value of Equity**
or equivalently:
**P/B = Share Price / Book Value per Share**
Use the same share count convention consistently.
## Book Value per Share
**BVPS = Shareholders' Equity / Shares Outstanding**
Prefer diluted shares when appropriate and state the convention.
## EV
**Enterprise Value = Market Capitalization + Total Debt + Preferred Equity + Minority Interest − Cash & Cash Equivalents**
Only include components that are actually applicable.
Do not automatically treat every investment as cash.
## EV/EBITDA
**EV/EBITDA = Enterprise Value / EBITDA**
Use the same EBITDA definition throughout the analysis.
## EV/Sales
**EV/Sales = Enterprise Value / Revenue**

---
# 8. Dividend Metrics
## Dividend Yield
**Dividend Yield = Annual Dividend per Share / Current Share Price × 100**
State whether the dividend is:
* Final
* Interim
* Total annual dividend
## Dividend Payout Ratio
Primary formula:
**Dividend Payout = Total Equity Dividend / PAT × 100**
If using DPS/EPS, state that alternative calculation.
## Dividend CAGR
**Dividend CAGR = [(Ending DPS / Beginning DPS)^(1/N) − 1] × 100**

---
# 9. Working Capital
## Receivable Days
**Receivable Days = Average Trade Receivables / Revenue × 365**
For companies where revenue includes materially different components, explain the denominator used.
## Inventory Days
**Inventory Days = Average Inventory / Cost of Goods Sold × 365**
Use COGS rather than revenue where appropriate.
## Payable Days
**Payable Days = Average Trade Payables / Relevant Purchases or COGS × 365**
State which denominator is used.
## Cash Conversion Cycle
**CCC = Receivable Days + Inventory Days − Payable Days**
For service companies with negligible inventory, inventory days may be close to zero.

---
# 10. Per-Employee Metrics
For employee-intensive businesses such as IT companies:
## Revenue per Employee
**Revenue per Employee = Revenue / Average Number of Employees**
## Profit per Employee
**Profit per Employee = PAT / Average Number of Employees**
Use average employee count when beginning and ending numbers are available.

---
# 11. Segment Growth
For each segment:
**Segment Growth % = (Current Segment Revenue − Previous Segment Revenue) / Previous Segment Revenue × 100**
Do not compare segment percentages if accounting classifications changed materially without explaining the change.

---
# 12. Peer Comparison Rules
When comparing companies:
* Use the same financial period where possible.
* Use consolidated numbers consistently.
* Use the same valuation date.
* Use the same formula for every company.
* Do not compare TTM metrics with annual metrics.
* Do not mix reported EBITDA with adjusted EBITDA.
* Clearly identify differences in accounting policies.
If a peer uses a different accounting convention, explain the limitation rather than pretending the figures are perfectly comparable.

---
# 13. Data Hierarchy
Use this priority:
1. Audited Annual Report
2. Audited Financial Statements
3. Stock exchange filings
4. Official company investor presentations
5. Official company earnings releases
6. Reliable market-data sources for current valuation
7. Reputable third-party databases for cross-checking
If sources disagree:
* Show the discrepancy.
* Prefer the audited/primary source.
* Explain why one figure was selected.

---
# 14. Consolidated vs Standalone
Use **consolidated financial statements as the default** for investment analysis.
Use standalone statements only when:
* A consolidated figure is unavailable.
* A specific subsidiary/parent analysis is required.
* The distinction materially affects interpretation.
Never mix consolidated revenue with standalone profit, or vice versa, without explicitly stating it.

---
# 15. Restatements & Exceptional Items
If prior-year numbers have been:
* Restated
* Reclassified
* Recast
* Adjusted for discontinued operations
use the **latest restated/recast comparative numbers** where appropriate.
Separately identify:
* Exceptional items
* One-time gains
* One-time losses
* Impairments
* Restructuring costs
* Acquisition-related costs
Show both:
**Reported result**
and, where meaningful,
**Adjusted result**
Do not remove an item merely because it makes the result look better.

---
# 16. Negative / Zero Denominators
Never calculate misleading ratios when the denominator is:
* Zero
* Negative
* Not meaningful
Instead write:
**N/M — Not Meaningful**
and explain why.

---
# 17. Rounding Rules
Use:
* ₹ crore for Indian companies unless another unit is more appropriate.
* Percentages: **1 decimal place**
* Ratios: **2 decimal places**
* P/E and valuation multiples: **1 decimal place**
* EPS: **2 decimal places**
* CAGR: **1 decimal place**
Do not round intermediate calculations. Round only the final displayed result.

---
# 18. Formula Transparency
For every calculated metric, provide:
**Formula → Inputs → Calculation → Result**

---
# 19. Data Validation
Before producing the final report:
1. Cross-check Revenue against the Income Statement.
2. Cross-check PAT against the audited financial statements.
3. Cross-check cash flow against the Cash Flow Statement.
4. Check that Balance Sheet assets = liabilities + equity.
5. Check EPS against reported EPS where available.
6. Check share count used for valuation.
7. Check that market capitalization corresponds to the stated share price/date.
8. Check that ratios use consistent numerator and denominator periods.
9. Flag any material discrepancy.
10. Never fill missing data with assumptions without explicitly labeling the assumption.

---
# 20. Required Output
At the end of the report, include a section:
## Formula & Data Audit
| Metric         | Formula Used                  | Period | Source                      | Result |
| -------------- | ----------------------------- | ------ | --------------------------- | ------ |
| Revenue Growth | (CY-PY)/PY                    | FYxx   | Annual Report               |        |
| EBITDA Margin  | EBITDA/Revenue                | FYxx   | Annual Report               |        |
| ROE            | PAT/Average Equity            | FYxx   | Annual Report               |        |
| ROCE           | EBIT/Average Capital Employed | FYxx   | Annual Report               |        |
| Debt/Equity    | Debt/Equity                   | FYxx   | Annual Report               |        |
| OCF/PAT        | OCF/PAT                       | FYxx   | Annual Report               |        |
| FCF            | OCF-Capex                     | FYxx   | Annual Report               |        |
| P/E            | Price/Diluted EPS             | Date   | Market Data                 |        |
| P/B            | Market Cap/Book Value         | Date   | Market Data                 |        |
| EV/EBITDA      | EV/EBITDA                     | Date   | Market Data + Annual Report |        |
| Dividend Yield | DPS/Price                     | Date   | Company + Market Data       |        |
The objective is to make the analysis **reproducible**: another analyst using the same source data and formulas should arrive at approximately the same results.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.AI_MODEL_NAME || 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 8192,
    });

    const analysis = chatCompletion.choices[0]?.message?.content || "No analysis generated.";
    res.json({ data: { analysis } });
  } catch (error: any) {
    console.error("Failed to analyze company:", error.message || error);
    res.status(500).json({ message: "Failed to analyze company", error: error.message || "Unknown error" });
  }
};

import axios from 'axios';
import * as cheerio from 'cheerio';

export const getAnnualReport = async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    if (!symbol) return res.status(400).json({ message: "Symbol is required" });

    // Scrape Screener.in for the Annual Report link
    const url = `https://www.screener.in/company/${symbol}/`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const reports: { title: string; url: string }[] = [];

    // Find the Annual reports section
    $('.documents.annual-reports a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      
      // Look for links that match "Annual Report 20xx"
      if (text.startsWith('Annual Report') && href) {
        reports.push({ title: text, url: href });
      }
    });

    if (reports.length > 0) {
      return res.json({ data: reports });
    } else {
      return res.status(404).json({ message: "Annual report not found on Screener.in" });
    }
  } catch (error) {
    console.error(`Failed to fetch annual report for ${req.params.symbol}:`, error);
    return res.status(500).json({ message: "Failed to fetch annual report" });
  }
};
export const searchSymbols = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.json({ data: [] });

    const [yahooResults, mfapiRes] = await Promise.allSettled([
      yahooFinance.search(query),
      fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`).then(r => r.json())
    ]);

    const results = [];

    if (yahooResults.status === 'fulfilled' && yahooResults.value.quotes) {
      const eq = yahooResults.value.quotes
        .filter((q: any) => q.isYahooFinance)
        .slice(0, 5)
        .map((q: any) => ({
          symbol: q.symbol.replace('.NS', ''),
          name: q.shortname || q.longname,
          assetClass: 'Indian Equity'
        }));
      results.push(...eq);
    }

    if (mfapiRes.status === 'fulfilled' && Array.isArray(mfapiRes.value)) {
      const mfs = mfapiRes.value.slice(0, 5).map((mf: any) => ({
        symbol: mf.schemeCode.toString(),
        name: mf.schemeName,
        assetClass: 'Mutual Fund'
      }));
      results.push(...mfs);
    }

    res.json({ data: results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
};


export const getMetals = async (req: Request, res: Response) => {
  try {
    const results = await yahooFinance.quote(['XAUUSD=X', 'XAGUSD=X', 'XPTUSD=X', 'INR=X']);
    let inrRate = 84.0;
    let goldOz = 2600;
    let silverOz = 30;
    let platOz = 1000;
    
    for (const r of results) {
      if (r.symbol === 'INR=X') inrRate = r.regularMarketPrice || inrRate;
      if (r.symbol === 'XAUUSD=X') goldOz = r.regularMarketPrice || goldOz;
      if (r.symbol === 'XAGUSD=X') silverOz = r.regularMarketPrice || silverOz;
      if (r.symbol === 'XPTUSD=X') platOz = r.regularMarketPrice || platOz;
    }

    // 1 Troy Ounce = 31.1034768 grams
    const OUNCE_IN_GRAMS = 31.1034768;
    
    const goldPerGramInr = (goldOz * inrRate) / OUNCE_IN_GRAMS;
    const silverPerGramInr = (silverOz * inrRate) / OUNCE_IN_GRAMS;
    const platPerGramInr = (platOz * inrRate) / OUNCE_IN_GRAMS;

    res.status(200).json({
      success: true,
      data: {
        gold: goldPerGramInr,
        silver: silverPerGramInr,
        platinum: platPerGramInr
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
