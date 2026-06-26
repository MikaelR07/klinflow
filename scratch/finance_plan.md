# Restyle Company Finance Page

This plan details the restructuring of the `FleetFinance.tsx` page to closely match the provided reference image, adhering to the specified rows and elements.

## 1. Top Row: KPI Stats Cards
I will replace the existing 3 top cards with a new 5-column grid layout containing the following KPI cards:
- **Available Cash** (Mapped to existing `profile?.walletBalance` logic)
- **Total Disbursed** (Mapped to existing `totalMoneySent` logic)
- **Pending Approvals** (Mapped to existing `requests.length` logic)
- **Material Spend** (Mapped to existing `totalSpentOnMaterials` logic)
- **Gross Margin** (Mocked data: e.g. 28.4%)

## 2. Second Row: 3 Cards
I will create a 3-column grid (`grid-cols-1 xl:grid-cols-3`):
- **Cash Flow Overview (New)**: A line chart displaying "Money Sent to Agents" vs "Money Recorded Buying Materials". I will generate mock historical data for this since the backend currently only returns total aggregates.
- **Material Spend Breakdown (Existing)**: Kept exactly as it is (Pie Chart).
- **Pending Approvals (Existing)**: Kept exactly as it is (List of agents with their notes and Approve/Decline buttons).

## 3. Third Row: 2 Cards
I will create a 2-column grid (`grid-cols-1 xl:grid-cols-3` where Transactions take 2 columns and Insights take 1):
- **Recent Transactions (Existing)**: The current ledger of transactions.
- **Spend Insights (New)**: A new card highlighting actionable insights (e.g. "Material spend decreased by 6%", "Plastic prices trending up") instead of Large Expenditures.

## 4. General Cleanup
- Ensure no 4th row is added.
- Existing Supabase fetching logic, state hooks, and action handlers (`handleApprove`, `handleDecline`) will be strictly preserved.
