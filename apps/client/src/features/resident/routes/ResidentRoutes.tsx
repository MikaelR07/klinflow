import { lazy } from 'react';
import { Route } from 'react-router-dom';

const UserHome = lazy(() => import('../../../pages/user/UserHome'));
const DiscoveryHub = lazy(() => import('../../../pages/user/Discovery'));
const Leaderboard = lazy(() => import('../../../pages/user/Leaderboard'));
const BookPickup = lazy(() => import('../../../pages/user/BookPickup'));
const MyBookings = lazy(() => import('../../../pages/user/MyBookings'));
const ImpactHub = lazy(() => import('../../../pages/user/ImpactHub'));
const WithdrawalPage = lazy(() => import('../../../pages/user/WithdrawalPage'));
const CompanyProfile = lazy(() => import('../../../pages/user/CompanyProfile'));
const AgentReviews = lazy(() => import('../../../pages/user/AgentReviews'));
const ImpactAnalytics = lazy(() => import('../../../pages/user/ImpactAnalytics'));
const ResidentWallet = lazy(() => import('../../../pages/user/ResidentWallet'));
const RedeemGFP = lazy(() => import('../../../pages/user/RedeemGFP'));
const TransferGFP = lazy(() => import('../../../pages/user/TransferGFP'));
const TransferHistory = lazy(() => import('../../../pages/user/TransferHistory'));
const RedemptionHistory = lazy(() => import('../../../pages/user/RedemptionHistory'));
const NotificationsFeed = lazy(() => import('../../../pages/user/NotificationsFeed'));

export function getResidentRoutes() {
  return (
    <>
      <Route path="/" element={<UserHome />} />
      <Route path="/withdraw" element={<WithdrawalPage />} />
      <Route path="/resident-wallet" element={<ResidentWallet />} />
      <Route path="/redeem-gfp" element={<RedeemGFP />} />
      <Route path="/redemption-history" element={<RedemptionHistory />} />
      <Route path="/transfer-gfp" element={<TransferGFP />} />
      <Route path="/wallet-history" element={<TransferHistory />} />
      <Route path="/discovery" element={<DiscoveryHub />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/book-pickup" element={<BookPickup />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/impact-hub" element={<ImpactHub />} />
      <Route path="/company/:agentId" element={<CompanyProfile />} />
      <Route path="/company/:agentId/reviews" element={<AgentReviews />} />
      <Route path="/analytics" element={<ImpactAnalytics />} />
      <Route path="/notifications" element={<NotificationsFeed />} />
    </>
  );
}
