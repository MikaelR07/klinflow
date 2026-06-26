import re

with open('apps/hub/src/App.tsx', 'r') as f:
    content = f.read()

# Add new imports
new_imports = """
import FleetOverview from './pages/FleetOverview';
import DispatchManagement from './pages/DispatchManagement';
import KlinMarket from './pages/KlinMarket';
import RFQs from './pages/RFQs';
import PriceDashboard from './pages/PriceDashboard';
import AgentDisbursements from './pages/AgentDisbursements';
"""
content = content.replace("import Traceability from './pages/Traceability';", f"import Traceability from './pages/Traceability';{new_imports}")

# Update Operations -> Dispatch Management
content = content.replace(
    '<Route path="/operations/dispatch" element={<PlaceholderPage title="Dispatch Management" />} />',
    '<Route path="/operations/dispatch" element={<DispatchManagement />} />'
)

# Update Fleet Management -> Fleet Overview
content = content.replace(
    '<Route path="/fleet/overview" element={<PlaceholderPage title="Fleet Overview" />} />',
    '<Route path="/fleet/overview" element={<FleetOverview />} />'
)

# Update Marketplace -> Klin Market
content = content.replace(
    '<Route path="/marketplace/market" element={<PlaceholderPage title="Klin Market" />} />',
    '<Route path="/marketplace/market" element={<KlinMarket />} />'
)

# Update Marketplace -> RFQs
content = content.replace(
    '<Route path="/marketplace/rfqs" element={<PlaceholderPage title="RFQs" />} />',
    '<Route path="/marketplace/rfqs" element={<RFQs />} />'
)

# Update Market Intelligence -> Price Dashboard (Replaces PricingEngine)
content = content.replace(
    '<Route path="/intelligence/pricing" element={<PricingEngine />} />',
    '<Route path="/intelligence/pricing" element={<PriceDashboard />} />'
)

# Update Finance -> Agent Disbursements (Add new route)
content = content.replace(
    '<Route path="/finance/revenue" element={<PlaceholderPage title="Revenue Analytics" />} />',
    '<Route path="/finance/revenue" element={<PlaceholderPage title="Revenue Analytics" />} />\n          <Route path="/finance/disbursements" element={<AgentDisbursements />} />'
)

with open('apps/hub/src/App.tsx', 'w') as f:
    f.write(content)
