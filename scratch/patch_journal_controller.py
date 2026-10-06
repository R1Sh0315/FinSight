import re
with open("fm-be/src/modules/journal/journal.controller.ts", "r") as f:
    content = f.read()

update_logic = """
export const updateJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedEntry = await JournalEntry.findOneAndUpdate(
      { _id: id, user: (req as any).userId },
      { ...req.body },
      { new: true }
    );
    if (!updatedEntry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.status(200).json({ success: true, data: updatedEntry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
"""

content += "\n" + update_logic

with open("fm-be/src/modules/journal/journal.controller.ts", "w") as f:
    f.write(content)
