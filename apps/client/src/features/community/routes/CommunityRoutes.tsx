import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@klinflow/ui/components/ProtectedRoute';

const CommunityCollective = lazy(() => import('../../../pages/user/CommunityCollective'));
const GroupCollectionRFQs = lazy(() => import('../../../pages/user/GroupCollectionRFQs'));
const IndividualRFQs = lazy(() => import('../../../pages/user/IndividualRFQs'));
const GroupCollectionRFQDetails = lazy(() => import('../../../pages/user/GroupCollectionRFQDetails'));
const FinancingHub = lazy(() => import('../../../pages/user/FinancingHub'));

export function getCommunityRoutes() {
  return (
    <>
      <Route path="/community-collective" element={<ProtectedRoute><CommunityCollective /></ProtectedRoute>} />
      <Route path="/group-rfqs" element={<ProtectedRoute><GroupCollectionRFQs /></ProtectedRoute>} />
      <Route path="/individual-rfqs" element={<ProtectedRoute><IndividualRFQs /></ProtectedRoute>} />
      <Route path="/group-rfqs/:id" element={<ProtectedRoute><GroupCollectionRFQDetails /></ProtectedRoute>} />
      <Route path="/financing" element={<ProtectedRoute><FinancingHub /></ProtectedRoute>} />
    </>
  );
}
