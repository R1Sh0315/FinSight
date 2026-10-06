with open("fm-be/src/modules/market/market.controller.ts", "r") as f:
    content = f.read()

new_logic = """
export const getMetals = async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://metalscost.com/api/dashboard-cards.php');
    const data = await response.json();
    
    // Fallbacks in case the API doesn't return the exact keys
    const gold = parseFloat(data.todaysData['INRXAU-BANG']) || 14918;
    const silver = parseFloat(data.todaysData['INRXAG-BANG']) || 235;
    const platinum = parseFloat(data.todaysData['INRXPT']) || 5334;

    res.status(200).json({
      success: true,
      data: {
        gold: gold,
        silver: silver,
        platinum: platinum
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
"""

import re
content = re.sub(r'export const getMetals = async \(req: Request, res: Response\) => \{.*?\n\};\n', new_logic, content, flags=re.DOTALL)

with open("fm-be/src/modules/market/market.controller.ts", "w") as f:
    f.write(content)
