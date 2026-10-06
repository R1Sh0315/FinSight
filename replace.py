import re

with open('fm-fe/src/App.tsx', 'r') as f:
    content = f.read()

with open('scratch/layout.tsx', 'r') as f:
    new_layout = f.read()

# Replace everything from function Layout to the end of the file except the App function
# Actually, it's safer to use regex
pattern = re.compile(r'function Layout.*?^}', re.MULTILINE | re.DOTALL)
new_content = pattern.sub(new_layout, content, count=1)

with open('fm-fe/src/App.tsx', 'w') as f:
    f.write(new_content)
