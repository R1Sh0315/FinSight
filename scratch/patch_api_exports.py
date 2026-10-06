import re
with open("fm-fe/src/store/api.ts", "r") as f:
    content = f.read()

content = content.replace("useSearchSymbolsQuery,", "useSearchSymbolsQuery,\n  useGetMetalsQuery,")

with open("fm-fe/src/store/api.ts", "w") as f:
    f.write(content)
