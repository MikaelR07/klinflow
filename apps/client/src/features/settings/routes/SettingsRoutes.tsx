import { lazy } from 'react';
import { Route } from 'react-router-dom';

const SettingsMenu = lazy(() => import('../../../pages/settings/SettingsMenu'));
const ProfilePage = lazy(() => import('../../../pages/settings/ProfilePage'));
const NotificationsPage = lazy(() => import('../../../pages/settings/NotificationsPage'));
const PrivacySecurityPage = lazy(() => import('../../../pages/settings/PrivacySecurityPage'));
const SupportPage = lazy(() => import('../../../pages/settings/SupportPage'));
const FeedbackPage = lazy(() => import('../../../pages/settings/FeedbackPage'));
const SubscriptionPage = lazy(() => import('../../../pages/settings/SubscriptionPage'));
const SubscriptionDetail = lazy(() => import('../../../pages/settings/SubscriptionDetail'));

export function getSettingsRoutes() {
  return (
    <Route path="/settings">
      <Route index element={<SettingsMenu />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="subscriptions" element={<SubscriptionPage />} />
      <Route path="subscriptions/:tierId" element={<SubscriptionDetail />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="privacy" element={<PrivacySecurityPage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="feedback" element={<FeedbackPage />} />
    </Route>
  );
}
