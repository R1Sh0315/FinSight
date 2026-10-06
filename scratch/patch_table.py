with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<table className="w-full text-left border-collapse">',
    '<div className="overflow-x-auto w-full">\n                <table className="w-full text-left border-collapse min-w-[800px]">'
)

content = content.replace(
    '</table>\n            )}',
    '</table>\n              </div>\n            )}'
)

with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
