import re
with open("fm-be/src/modules/journal/journal.routes.ts", "r") as f:
    content = f.read()

content = content.replace(
    "import { getJournalEntries, addJournalEntry, deleteJournalEntry }",
    "import { getJournalEntries, addJournalEntry, deleteJournalEntry, updateJournalEntry }"
)

content = content.replace(
    "router.delete('/:id', deleteJournalEntry);",
    "router.delete('/:id', deleteJournalEntry);\nrouter.put('/:id', updateJournalEntry);"
)

with open("fm-be/src/modules/journal/journal.routes.ts", "w") as f:
    f.write(content)
