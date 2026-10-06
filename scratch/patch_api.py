with open("fm-fe/src/store/api.ts", "r") as f:
    content = f.read()

patch = """
    // Journal Endpoints
    getJournalEntries: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => 'journal',
      providesTags: ['Journal'] as any
    }),
    addJournalEntry: builder.mutation<any, any>({
      query: (body) => ({
        url: 'journal',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Journal'] as any
    }),
    deleteJournalEntry: builder.mutation<any, string>({
      query: (id) => ({
        url: `journal/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Journal'] as any
    }),
"""

content = content.replace("    getForexRates:", patch + "    getForexRates:")

with open("fm-fe/src/store/api.ts", "w") as f:
    f.write(content)
