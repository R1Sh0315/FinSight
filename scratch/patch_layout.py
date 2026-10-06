import re
with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

# Make the huge text smaller on small screens
content = content.replace('className="text-[28px] font-bold tracking-tight text-dash-text-primary"', 'className="text-[22px] xl:text-[26px] font-bold tracking-tight text-dash-text-primary truncate"')
content = content.replace('text-[28px] font-bold tracking-tight ${totalPnL > 0 ? \'text-green-500\' : totalPnL < 0 ? \'text-red-500\' : \'text-dash-text-primary\'}', 'text-[22px] xl:text-[26px] font-bold tracking-tight truncate ${totalPnL > 0 ? \'text-green-500\' : totalPnL < 0 ? \'text-red-500\' : \'text-dash-text-primary\'}')

# Fix the clipping in the Precious Metals cards
# Change text-[18px] to text-[16px] xl:text-[18px]
content = content.replace('className="text-[18px] font-bold text-dash-text-primary tracking-wide"', 'className="text-[15px] xl:text-[18px] font-bold text-dash-text-primary tracking-wide"')

with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
