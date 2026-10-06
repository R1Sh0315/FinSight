import re
with open("fm-be/src/app.ts", "r") as f:
    content = f.read()

import_stmt = "import forexRoutes from \"./modules/forex/forex.routes.js\";\nimport journalRoutes from \"./modules/journal/journal.routes.js\";"
content = content.replace('import forexRoutes from "./modules/forex/forex.routes.js";', import_stmt)

route_stmt = "app.use(\"/api/v1/forex\", forexRoutes);\napp.use(\"/api/v1/journal\", journalRoutes);"
content = content.replace('app.use("/api/v1/forex", forexRoutes);', route_stmt)

with open("fm-be/src/app.ts", "w") as f:
    f.write(content)
