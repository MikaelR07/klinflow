export interface CommodityTrend {
  id: string;
  label: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  demand: string;
  category: string;
  region: string;
  change: string;
  supply: string;
  topBuyer: string;
}

export interface MarketOpportunity {
  tagColor: string;
  tag: string;
  material: string;
  metricLabel: string;
  metricValue: string;
  changeType: 'positive' | 'negative';
  change: string;
}

export interface MarketSignal {
  trend: 'up' | 'down';
  text: string;
  subtext: string;
}

export interface Hotspot {
  area: string;
  score: number;
}

export interface Recommendation {
  color: string;
  title: string;
  text: string;
  priority: string;
}

export interface MarketData {
  commodity_trends?: CommodityTrend[];
  ai_trends?: any[];
  actionable_insights?: any[];
  opportunities?: MarketOpportunity[];
  market_signals?: MarketSignal[];
  hotspots?: Hotspot[];
  recommendations?: Recommendation[];
  insights?: any[];
  [key: string]: any;
}
