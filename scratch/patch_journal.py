import re
with open("fm-fe/src/pages/JournalPage.tsx", "r") as f:
    content = f.read()

# Add edit icon
content = content.replace("Search, Trash2 }", "Search, Trash2, Edit2 }")

# Add useUpdateJournalEntryMutation
content = content.replace(
    "useAddJournalEntryMutation, useDeleteJournalEntryMutation, useGetForexRatesQuery",
    "useAddJournalEntryMutation, useDeleteJournalEntryMutation, useUpdateJournalEntryMutation, useGetForexRatesQuery"
)

# Add editingId state
content = content.replace(
    "const [searchTerm, setSearchTerm] = useState('');",
    "const [searchTerm, setSearchTerm] = useState('');\n  const [editingId, setEditingId] = useState<string | null>(null);"
)

# Add update hook
content = content.replace(
    "const [addJournalEntry] = useAddJournalEntryMutation();",
    "const [addJournalEntry] = useAddJournalEntryMutation();\n  const [updateJournalEntry] = useUpdateJournalEntryMutation();"
)

# Handle Save Logic
handle_save_old = """    await addJournalEntry(newEntry).unwrap();
    setShowForm(false);
    setForm({
      symbol: '', type: 'LONG', currency: 'INR', multiplier: '1', entryPrice: '', exitPrice: '', quantity: '', setup: 'Breakout', emotion: 'Neutral', notes: ''
    });"""

handle_save_new = """    if (editingId) {
      await updateJournalEntry({ id: editingId, body: newEntry }).unwrap();
    } else {
      await addJournalEntry(newEntry).unwrap();
    }
    setShowForm(false);
    setEditingId(null);
    setForm({
      symbol: '', type: 'LONG', currency: 'INR', multiplier: '1', entryPrice: '', exitPrice: '', quantity: '', setup: 'Breakout', emotion: 'Neutral', notes: ''
    });"""
content = content.replace(handle_save_old, handle_save_new)

# Cancel edit
cancel_old = """onClick={() => setShowForm(false)}"""
cancel_new = """onClick={() => { setShowForm(false); setEditingId(null); setForm({ symbol: '', type: 'LONG', currency: 'INR', multiplier: '1', entryPrice: '', exitPrice: '', quantity: '', setup: 'Breakout', emotion: 'Neutral', notes: '' }); }}"""
content = content.replace(cancel_old, cancel_new)

# Edit form header
header_old = """<h2 className="text-[16px] font-semibold text-dash-text-primary mb-4 border-b border-dash-border pb-3">New Trade Entry</h2>"""
header_new = """<h2 className="text-[16px] font-semibold text-dash-text-primary mb-4 border-b border-dash-border pb-3">{editingId ? 'Edit Trade Entry' : 'New Trade Entry'}</h2>"""
content = content.replace(header_old, header_new)

# Edit button in list
edit_btn = """                        <button onClick={() => {
                          setEditingId(entry._id || entry.id!);
                          setForm({
                            symbol: entry.symbol,
                            type: entry.type,
                            currency: entry.currency || 'INR',
                            multiplier: (entry.multiplier || 1).toString(),
                            entryPrice: entry.entryPrice.toString(),
                            exitPrice: entry.exitPrice.toString(),
                            quantity: entry.quantity.toString(),
                            setup: entry.setup || 'Breakout',
                            emotion: entry.emotion || 'Neutral',
                            notes: entry.notes || ''
                          });
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="text-blue-500/70 hover:text-blue-500 transition-colors p-1" title="Edit">
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete"""

content = content.replace("                        <button onClick={() => handleDelete", edit_btn)

with open("fm-fe/src/pages/JournalPage.tsx", "w") as f:
    f.write(content)
