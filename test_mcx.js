async function test() {
  const url = "https://groww.in/v1/api/option_chain_service/v1/option_chain/derivatives/mcx_silver";
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(json.optionChainConfig);
    console.log(json.optionChain?.optionChains?.[0]);
  } catch(e) {
    console.error(e);
  }
}
test();
