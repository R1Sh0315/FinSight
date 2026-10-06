import re
with open("fm-fe/src/pages/HomePage.tsx", "r") as f:
    content = f.read()

# Replace the gold item
gold_old = """<div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <span className="text-[16px] font-bold text-yellow-500">Au</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Gold</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">"""
gold_new = """<div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <span className="text-[16px] font-bold text-yellow-500">Au</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-bold text-dash-text-primary truncate">Gold</h4>
                    <p className="text-[12px] text-dash-text-muted truncate">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">"""
content = content.replace(gold_old, gold_new)

# Replace silver
silver_old = """<div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-400/20 flex items-center justify-center border border-gray-400/30">
                    <span className="text-[16px] font-bold text-gray-300">Ag</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Silver</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">"""
silver_new = """<div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gray-400/20 flex items-center justify-center border border-gray-400/30">
                    <span className="text-[16px] font-bold text-gray-300">Ag</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-bold text-dash-text-primary truncate">Silver</h4>
                    <p className="text-[12px] text-dash-text-muted truncate">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">"""
content = content.replace(silver_old, silver_new)

# Replace platinum
plat_old = """<div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-300/20 flex items-center justify-center border border-slate-300/30">
                    <span className="text-[16px] font-bold text-slate-200">Pt</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dash-text-primary">Platinum</h4>
                    <p className="text-[12px] text-dash-text-muted">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right">"""
plat_new = """<div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-300/20 flex items-center justify-center border border-slate-300/30">
                    <span className="text-[16px] font-bold text-slate-200">Pt</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14px] font-bold text-dash-text-primary truncate">Platinum</h4>
                    <p className="text-[12px] text-dash-text-muted truncate">Per Gram (INR)</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">"""
content = content.replace(plat_old, plat_new)


with open("fm-fe/src/pages/HomePage.tsx", "w") as f:
    f.write(content)
