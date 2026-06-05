import { lazy } from 'react';
import { Route } from 'react-router-dom';

const SellerWallet = lazy(() => import('../../../pages/user/SellerWallet'));
const PostTrade = lazy(() => import('../../../pages/user/PostTrade'));
const MyTrades = lazy(() => import('../../../pages/user/MyTrades'));
const TrustScoreDetails = lazy(() => import('../../../pages/user/TrustScoreDetails'));
const MyOffers = lazy(() => import('../../../pages/user/MyOffers'));
const MyRFQOffers = lazy(() => import('../../../pages/user/MyRFQOffers'));
const MarketplaceInventory = lazy(() => import('../../../pages/user/MarketplaceInventory'));
const MarketIntelligenceHub = lazy(() => import('../../../pages/user/MarketIntelligenceHub'));
const CircularResume = lazy(() => import('../../../pages/user/CircularResume'));

export function getSellerRoutes() {
  return (
    <>
      <Route path="/seller-wallet" element={<SellerWallet />} />
      <Route path="/post-trade" element={<PostTrade />} />
      <Route path="/my-trades" element={<MyTrades />} />
      <Route path="/my-offers" element={<MyOffers />} />
      <Route path="/my-rfq-offers" element={<MyRFQOffers />} />
      <Route path="/inventory" element={<MarketplaceInventory />} />
      <Route path="/trust-score" element={<TrustScoreDetails />} />
      <Route path="/market-pulse" element={<MarketIntelligenceHub />} />
      <Route path="/circular-resume" element={<CircularResume />} />
    </>
  );
}
