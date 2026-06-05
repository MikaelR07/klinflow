/**
 * MarketIntelligenceHub Types — Extracted from MarketIntelligenceHub.tsx
 */

export interface MarketIntelRFQ {
  id: string;
  company: string;
  material: string;
  quantity: string;
  price: number;
  deadline: string;
  verified: boolean;
  region: string;
  category: string;
  delivery: string;
  offersSubmitted: number;
}

export interface MarketIntelCommodityTrend {
  id: string;
  label: string;
  price: number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  demand: string;
  supply: string;
  topBuyer: string;
  region: string;
  category: string;
}

export interface MarketIntelData {
  commodity_trends: MarketIntelCommodityTrend[];
  ai_trends?: any[];
  actionable_insights?: any[];
  opportunities?: any[];
  market_signals?: any[];
  hotspots?: any[];
  recommendations?: any[];
  insights?: any[];
  [key: string]: any;
}
