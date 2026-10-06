import re
with open("fm-be/src/modules/paperTrade/paperTrade.routes.ts", "r") as f:
    content = f.read()

content = content.replace("recordDailyPrice\n}", "recordDailyPrice,\n  syncPrices\n}")
content = content.replace('router.post("/", createPaperTrade);', 'router.post("/", createPaperTrade);\nrouter.post("/sync", syncPrices);')

with open("fm-be/src/modules/paperTrade/paperTrade.routes.ts", "w") as f:
    f.write(content)
