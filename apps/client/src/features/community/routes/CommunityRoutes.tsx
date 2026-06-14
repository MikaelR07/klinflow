import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';

const CommunityCollective = lazy(() => import('../../../pages/user/CommunityCollective'));
const CreateSwarm = lazy(() => import('../../../pages/user/CreateSwarm'));
const EditSwarm = lazy(() => import('../../../pages/user/EditSwarm'));
const JoinSwarm = lazy(() => import('../../../pages/user/JoinSwarm'));
const SwarmsList = lazy(() => import('../../../pages/user/SwarmsList'));
const GroupCollectionRFQs = lazy(() => import('../../../pages/user/GroupCollectionRFQs'));

const SwarmDetails = lazy(() => import('../../../pages/user/SwarmDetails'));
const GroupCollectionRFQDetails = lazy(() => import('../../../pages/user/GroupCollectionRFQDetails'));
const FinancingHub = lazy(() => import('../../../pages/user/FinancingHub'));
const PostBulkTrade = lazy(() => import('../../../pages/user/PostBulkTrade'));
const RequestGroupPickup = lazy(() => import('../../../pages/user/RequestGroupPickup'));

export function getCommunityRoutes() {
  return (
    <>
      <Route path="/community-collective" element={<ProtectedRoute><CommunityCollective /></ProtectedRoute>} />
      <Route path="/swarms" element={<ProtectedRoute><SwarmsList /></ProtectedRoute>} />
      <Route path="/group-rfqs" element={<ProtectedRoute><GroupCollectionRFQs /></ProtectedRoute>} />
      <Route path="/community-collective/swarm/create" element={<ProtectedRoute><CreateSwarm /></ProtectedRoute>} />
      <Route path="/community-collective/swarm/:id/edit" element={<ProtectedRoute><EditSwarm /></ProtectedRoute>} />
      <Route path="/community-collective/swarm/:id/join" element={<ProtectedRoute><JoinSwarm /></ProtectedRoute>} />
      <Route path="/community-collective/swarm/:id/post-trade" element={<ProtectedRoute><PostBulkTrade /></ProtectedRoute>} />
      <Route path="/community-collective/swarm/:id/request-pickup" element={<ProtectedRoute><RequestGroupPickup /></ProtectedRoute>} />

      <Route path="/community-collective/swarm/:id" element={<ProtectedRoute><SwarmDetails /></ProtectedRoute>} />
      <Route path="/group-rfqs/:id" element={<ProtectedRoute><GroupCollectionRFQDetails /></ProtectedRoute>} />
      <Route path="/financing" element={<ProtectedRoute><FinancingHub /></ProtectedRoute>} />
    </>
  );
}
