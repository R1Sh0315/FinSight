with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

platinum_card = """
            <div className="h-[140px] rounded-lg overflow-hidden border border-dash-border pointer-events-none">
              <MiniChart colorTheme="dark" symbol="TVC:PLATINUM" width="100%" height="100%" dateRange="1M" isTransparent={true} />
            </div>"""

target = '<MiniChart colorTheme="dark" symbol="MCX:SILVER1!" width="100%" height="100%" dateRange="1M" isTransparent={true} />\n            </div>'
content = content.replace(target, target + platinum_card)

with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
