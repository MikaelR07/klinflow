export interface RFQ {
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

export interface Insight {
  iconName: string;
  color: string;
  category: string;
  badge: string;
  title: string;
  text: string;
}

export interface MarketData {
  commodity_trends?: CommodityTrend[];
  opportunities?: MarketOpportunity[];
  market_signals?: MarketSignal[];
  hotspots?: Hotspot[];
  recommendations?: Recommendation[];
  insights?: Insight[];
}
