export interface MarketSignal {
  material: string;
  text: string;
  subtext: string;
  trend: 'up' | 'down' | 'stable';
  time: string;
}

export interface Hotspot {
  name: string;
  pct: string;
}

export interface CommodityTrend {
  id: string;
  label: string;
  category: string;
  price: number;
  highest_price: number;
  change_30d: string;
  change_7d: string;
  trend: 'up' | 'down' | 'stable';
  demand: string;
  supply: string;
  topBuyer: string;
  region: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  material_grade: string;
  alert_type: 'above' | 'below';
  threshold_price: number;
  is_active: boolean;
  created_at: string;
}

export interface MarketIntelligencePayload {
  commodity_trends: CommodityTrend[];
  hotspots: Hotspot[];
  market_signals: MarketSignal[];
  opportunities: any[];
  recommendations: any[];
  insights: any;
}
