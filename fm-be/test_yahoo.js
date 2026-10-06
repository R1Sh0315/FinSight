import yahooFinanceDefault from 'yahoo-finance2';
const yahooFinance = new (yahooFinanceDefault as any)();
async function test() {
  const data = await yahooFinance.quote(['XAGUSD=X', 'XAUUSD=X', 'SI=F', 'GC=F', 'INR=X']);
  console.log(data.map(d => `${d.symbol}: ${d.regularMarketPrice}`));
}
test();
