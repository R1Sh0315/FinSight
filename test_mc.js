async function test() {
  const url = "https://appfeeds.moneycontrol.com/jsonapi/fno/overview&format=json&inst_type=options&symbol=M%26M";
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}
test();
