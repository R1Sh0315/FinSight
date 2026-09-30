const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const response = await axios.get('https://www.screener.in/company/TCS/consolidated/');
  const $ = cheerio.load(response.data);
  const name = $('h1').first().text().trim();
  const marketCap = $('li:contains("Market Cap") .number').text().trim();
  const currentPrice = $('li:contains("Current Price") .number').text().trim();
  
  console.log({ name, marketCap, currentPrice });
}
test();
