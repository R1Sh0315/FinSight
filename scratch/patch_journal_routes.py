with open("fm-be/src/modules/journal/journal.routes.ts", "r") as f:
    content = f.read()

content = content.replace("authenticate", "protect")

with open("fm-be/src/modules/journal/journal.routes.ts", "w") as f:
    f.write(content)
