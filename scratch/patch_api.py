import re
with open("fm-fe/src/store/api.ts", "r") as f:
    content = f.read()

patch = """
    updateJournalEntry: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `journal/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Journal'] as any
    }),
"""

content = content.replace("    deleteJournalEntry:", patch + "    deleteJournalEntry:")
content = content.replace("useAddJournalEntryMutation,", "useAddJournalEntryMutation,\n  useUpdateJournalEntryMutation,")

with open("fm-fe/src/store/api.ts", "w") as f:
    f.write(content)
