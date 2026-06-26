with open('apps/agent/src/pages/admin/FleetManagement.tsx', 'r') as f:
    text = f.read()

import re
# check number of { and } and <div and </div
print(f"<div: {text.count('<div')}")
print(f"</div: {text.count('</div')}")
