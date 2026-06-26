import re

with open('apps/hub/src/layouts/HubLayout.tsx', 'r') as f:
    content = f.read()

# Add Agent Disbursements to Finance section
content = content.replace(
    "{ name: 'Revenue Analytics', path: '/finance/revenue' },",
    "{ name: 'Revenue Analytics', path: '/finance/revenue' },\n      { name: 'Agent Disbursements', path: '/finance/disbursements' },"
)

with open('apps/hub/src/layouts/HubLayout.tsx', 'w') as f:
    f.write(content)
