import re
with open("fm-fe/src/pages/JournalPage.tsx", "r") as f:
    content = f.read()

# Fix isLoading
content = content.replace("const { data: journalData, isLoading } = useGetJournalEntriesQuery();", "const { data: journalData } = useGetJournalEntriesQuery();")

# Fix forex call
content = content.replace("const { data: forexData } = useGetForexRatesQuery();", "const { data: forexData } = useGetForexRatesQuery('USD/INR');")

# Fix inrRate extraction
inr_fix = """  const inrRateObj = forexData?.data?.find(f => f.pair === 'USD/INR');
  const inrRate = inrRateObj ? inrRateObj.rate : 84;"""
content = content.replace("  const inrRate = forexData?.data?.INR || 84; // Fallback to 84", inr_fix)

with open("fm-fe/src/pages/JournalPage.tsx", "w") as f:
    f.write(content)
