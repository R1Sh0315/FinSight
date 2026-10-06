with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

content = content.replace("pointer-events-none", "")

with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
