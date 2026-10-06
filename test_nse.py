import requests

s = requests.Session()
s.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.5",
    "X-Requested-With": "XMLHttpRequest"
})

try:
    s.get("https://www.nseindia.com/option-chain", timeout=10)
    res = s.get("https://www.nseindia.com/api/option-chain-equities?symbol=NTPC", timeout=10)
    print("Status:", res.status_code)
    print(res.text[:500])
except Exception as e:
    print(e)
