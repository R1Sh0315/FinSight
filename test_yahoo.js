async function test() {
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=XAGUSD=X,XAUUSD=X,SI=F,GC=F,INR=X");
    const json = await res.json();
    console.log(json.quoteResponse.result.map(q => `${q.symbol}: ${q.regularMarketPrice}`));
  } catch(e) {
    console.error(e);
  }
}
test();
