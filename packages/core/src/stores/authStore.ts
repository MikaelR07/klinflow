import { toast } from 'sonner';
/**
 * authStore.ts — Klinflow KE Supabase Authentication & Profile State
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { ROLES } from '@klinflow/constants';
import { UserRole } from '@klinflow/types';
import { compressImage } from '../utils/imageUtils';
import { useNotificationStore } from './notificationStore';
import { AuthState, ProfileRow } from './authStore.types';
import { 
  normalizeKeys, 
  ProfileSchema, 
  Profile, 
  NotificationPrefs,
  safeParseOrNull
} from '../validation';

// ── Normalize phone for email mapping ─────────────────
export const normalizePhone = (num: string): string => {
  const clean = (num || '').replace(/\D/g, ''); 
  if (clean.length === 10 && clean.startsWith('0')) {
    return '+254' + clean.slice(1);
  }
  if (clean.length >= 12 && clean.includes('254')) {
    return '+' + clean.replace('+', '');
  }
  return clean;
};

export const phoneToEmail = (phone: string): string => `${normalizePhone(phone).replace('+', '')}@klinflow.ke`;

export const getBusinessLabel = (type: string, mode: string = 'id'): string => {
  const labels: Record<string, Record<string, string>> = {
    weaver: { 
      id: 'Weaver ID', terminal: 'Weaver Terminal', role: 'Weaver',
      sourceA: 'From Agents', sourceB: 'From Peers', actionAdd: 'Add Private Collection'
    },
    recycler: { 
      id: 'Recycler ID', terminal: 'Processing Hub', role: 'Recycler',
      sourceA: 'From Weavers', sourceB: 'Market Buys', actionAdd: 'Log Bulk Purchase'
    },
    manufacturer: { 
      id: 'Partner ID', terminal: 'Industrial Terminal', role: 'Manufacturer',
      sourceA: 'Sourced from Recyclers', sourceB: 'Direct Procurement', actionAdd: 'Register Intake'
    },
    retailer: { 
      id: 'Merchant ID', terminal: 'Supply Terminal', role: 'Retailer',
      sourceA: 'Stock Sourcing', sourceB: 'B2B Procurement', actionAdd: 'Add Inventory'
    },
    ngo: { 
      id: 'Organization ID', terminal: 'Logistics Hub', role: 'NGO',
      sourceA: 'Field Sourcing', sourceB: 'Hub Transfers', actionAdd: 'Log Collection'
    },
    other: { 
      id: 'Business ID', terminal: 'Terminal', role: 'Business',
      sourceA: 'Sourcing', sourceB: 'Market', actionAdd: 'Add Records'
    }
  };
  const config = labels[type] || labels.other!;
  return config[mode] || config.id!;
};

function defaultNotifPrefs(): NotificationPrefs {
  return {
    push: true, email: true, sms: false, marketing: false, communityNews: true,
    pickupReminders: true, aiInsights: true, rewardAlerts: true,
    emergencyAlerts: true, agentJobAlerts: true, systemAlerts: true,
    feedbackAlerts: true, dailyKpi: false, staffAlerts: true, channel: 'push',
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      role: ROLES.USER,
      profile: null,
      rewardPoints: 0, 
      walletBalance: 0,
      userId: null,
      notificationPrefs: defaultNotifPrefs(),
      profileSubscription: null,
      isInitializing: false,
      appRole: null,

      initializeAuth: async () => {
        if (get().isInitializing) return;
        if (get().isAuthenticated) return;
        
        set({ isInitializing: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              const uiProfile = get()._mapProfile(profileData as ProfileRow);
              if (uiProfile) {
                set({ 
                  isAuthenticated: true, 
                  userId: session.user.id, 
                  profile: uiProfile,
                  role: uiProfile.role || 'user'
                });
                get().subscribeToProfileChanges(session.user.id);
              }
            }
          } else {
            set({ isAuthenticated: false, token: null, profile: null, userId: null });
          }

          if (typeof window !== 'undefined' && !(window as any)._cfAuthVisibilitySetup) {
            (window as any)._cfAuthVisibilitySetup = true;
            window.addEventListener('visibilitychange', async () => {
              if (document.visibilityState === 'visible' && get().isAuthenticated) {
                try {
                  const { data, error } = await supabase.auth.getSession();
                  
                  if (error || !data.session) {
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError || !refreshData.session) {
                      get().logout();
                      toast.error('Connection Lost', { description: 'Your session has expired. Please sign in again.' });
                      return;
                    }
                  }

                  const { data: profileCheck, error: dbError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', get().userId!)
                    .maybeSingle();

                  if (dbError || !profileCheck) {
                    get().logout();
                    toast.error('Account Sync Error', { description: 'Please log in again to refresh your profile.' });
                  }
                } catch (e) {
                  console.warn('[AuthGate] Background sync failed:', e);
                }
              }
            });
          }

          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              set({ isAuthenticated: false, token: null, profile: null, userId: null });
              if (get().profileSubscription) {
                supabase.removeChannel(get().profileSubscription);
                set({ profileSubscription: null });
              }
            } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              if (get().isAuthenticated) return;

              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (profileData) {
                const appRole = get().appRole;
                const pData = profileData as ProfileRow;
                const userRole = pData.role;

                const isAuthorized = 
                  (appRole === 'client' && (userRole === ROLES.USER || userRole === 'resident' || userRole === 'seller')) ||
                  (appRole === 'agent'  && userRole === ROLES.AGENT) ||
                  (appRole === 'business' && userRole === ROLES.BUSINESS) ||
                  (appRole === 'admin' && (userRole === ROLES.ADMIN || pData.agent_account_type === 'company_admin')) ||
                  !appRole;

                if (!isAuthorized) {
                  await supabase.auth.signOut();
                  set({ isAuthenticated: false, profile: null });
                  return;
                }

                const uiProfile = get()._mapProfile(pData);
                if (!uiProfile) {
                  console.error('[Klinflow Auth] Profile validation failed for ID:', session.user.id);
                  return;
                }
                set({ 
                  isAuthenticated: true, 
                  userId: session.user.id, 
                  profile: uiProfile,
                  role: uiProfile.role || 'user'
                });
                get().subscribeToProfileChanges(session.user.id);
              }
            }
          });
        } catch (err) {
          console.error('[Klinflow Auth] Initialization failed:', err);
        } finally {
          set({ isInitializing: false });
        }
      },

      fetchProfile: async () => {
        const { userId } = get();
        if (!userId) return;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (profileData) {
          const uiProfile = get()._mapProfile(profileData as ProfileRow);
          if (uiProfile) {
            set({ 
              profile: uiProfile,
              rewardPoints: uiProfile.rewardPoints || 0,
              walletBalance: uiProfile.walletBalance || 0
            });
          }
        }
      },

      _mapProfile: (profileData: ProfileRow): Profile | null => {
        const normalized = normalizeKeys(profileData);
        // Ensure strictly typed fields for monetary values
        normalized.walletBalance = Number(profileData.wallet_balance || 0);
        normalized.rewardPoints = Number(profileData.reward_points || 0);
        const rawRating = profileData.rating;
        normalized.rating = (rawRating === null || rawRating === undefined || isNaN(Number(rawRating))) 
          ? 0.0 
          : Number(rawRating);
        
        return safeParseOrNull(ProfileSchema, normalized, 'AuthStore Profile Map');
      },

      subscribeToProfileChanges: async (uid: string) => {
        const id = uid || get().userId;
        if (!id) return;
        
        const existing = get().profileSubscription;
        if (existing) {
          try {
            await supabase.removeChannel(existing);
          } catch (e) {
            console.warn('[AuthStore] Profile cleanup failed:', e);
          }
          set({ profileSubscription: null });
        }

        const uniqueId = Math.random().toString(36).substring(7);
        const channelName = `profile-${id}-${uniqueId}`;
        
        const channel = supabase.channel(channelName)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${id}` 
          }, async (payload) => {
            const updated = payload.new as ProfileRow;
            const oldBalance = get().profile?.walletBalance || 0;
            const newBalance = Number(updated.wallet_balance || 0);
            
            // Force-fetch the latest profile from DB to guarantee accuracy
            const { data: freshProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', id)
              .single();

            if (freshProfile) {
              const uiProfile = get()._mapProfile(freshProfile as ProfileRow);
              if (!uiProfile) return;

              set({
                profile: uiProfile,
                rewardPoints: uiProfile.rewardPoints || 0,
                walletBalance: uiProfile.walletBalance || 0
              });


            }
          })
          .subscribe();
        
        set({ profileSubscription: channel });
      },

      topUpBalance: async (amount: number) => {
        const { userId, profile } = get();
        if (!userId) return false;

        // Execute server-authoritative financial mutation
        const { error, data } = await supabase.rpc('process_wallet_topup', {
          p_amount: Number(amount),
          p_method: 'M-PESA',
          p_reference: 'CF-' + Math.random().toString(36).substring(7).toUpperCase()
        });

        if (!error) {
          await get().fetchProfile();
          return true;
        }
        return false;
      },



      logout: async () => {
        const { profileSubscription } = get();
        
        set({ 
          isAuthenticated: false, 
          token: null, 
          role: ROLES.USER, 
          profile: null, 
          userId: null, 
          profileSubscription: null 
        });

        localStorage.removeItem('cf_auth_session');

        if (profileSubscription) {
          try {
            supabase.removeChannel(profileSubscription);
          } catch (e) {
            console.warn('[AuthStore] Channel cleanup failed', e);
          }
        }

        try {
          await supabase.auth.signOut();
        } catch (err) {
          // Ignore
        }
      },

      updateProfile: async (newData: Partial<Profile>): Promise<boolean> => {
        const { userId, profile } = get();
        if (!userId) throw new Error("Not authenticated");
        
        const VALID_COLUMNS = [
          'name', 'location', 'estate', 'avatar_url', 'id_number', 
          'business_type', 'business_name', 'specializations', 
          'nema_license', 'is_verified', 'is_online', 'is_staff', 'notification_prefs', 'notes',
          'subscription_tier'
        ];

        const sanitizedPayload: Record<string, any> = {};
        Object.entries(newData).forEach(([key, value]) => {
          let dbKey: string = key;
          // Reverse mapping camelCase to snake_case for DB
          if (key === 'idNumber') dbKey = 'id_number';
          if (key === 'isStaff') dbKey = 'is_staff';
          if (key === 'nemaLicense') dbKey = 'nema_license';
          if (key === 'businessType') dbKey = 'business_type';
          if (key === 'avatarUrl') dbKey = 'avatar_url';
          
          if (VALID_COLUMNS.includes(dbKey)) {
            if (dbKey === 'location' && value && typeof value === 'object') {
              const currentLoc = (profile?.location as any) || {};
              sanitizedPayload.location = {
                ...currentLoc,
                ...(value as object),
                latitude: (value as any).latitude !== undefined ? Number((value as any).latitude) : currentLoc.latitude,
                longitude: (value as any).longitude !== undefined ? Number((value as any).longitude) : currentLoc.longitude
              };
            } else {
              sanitizedPayload[dbKey] = value;
            }
          }
        });

        const { error } = await supabase.from('profiles').update(sanitizedPayload as any).eq('id', userId);
        if (error) throw new Error(error.message);
        
        set({ 
          profile: { 
            ...profile, 
            ...newData,
            location: sanitizedPayload.location || profile?.location
          } as Profile
        });
        return true;
      },

      uploadAvatar: async (file: File) => {
        const { userId, updateProfile } = get();
        if (!userId) throw new Error("Not authenticated");

        const compressed = await compressImage(file, { maxWidth: 512, quality: 0.8 });
        const fileExt = compressed.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        await updateProfile({ avatarUrl: publicUrl });
        return publicUrl;
      },

      toggleOnline: async (coords: { latitude: number; longitude: number } | null = null) => {
        const { userId, profile } = get();
        if (!userId) throw new Error("Not authenticated");
        
        const isGoingOnline = !profile?.isOnline;
        const updatePayload: Record<string, any> = {
          is_online: isGoingOnline
        };

        if (isGoingOnline && coords) {
          updatePayload.location = {
            ...((profile?.location as any) || {}),
            latitude: coords.latitude,
            longitude: coords.longitude,
            status: 'active',
            last_pulse: new Date().toISOString()
          };
        }

        const { error } = await supabase.from('profiles').update(updatePayload as any).eq('id', userId);
        if (error) throw new Error(error.message);
        
        set({ 
          profile: { 
            ...profile, 
            isOnline: isGoingOnline,
            location: updatePayload.location || profile?.location
          } as Profile
        });
      },

      withdrawRewards: async (amount: number) => {
        const { userId, walletBalance, profile } = get();
        if (!userId) throw new Error("Not authenticated");
        if (amount > walletBalance) throw new Error("Insufficient funds");

        const { error } = await supabase.rpc('process_wallet_withdrawal', {
          p_amount: amount,
          p_method: 'M-PESA',
          p_account: profile?.phone || ''
        });
          
        if (error) throw new Error(error.message);
        await get().fetchProfile();
      },

      depositToWallet: async (amount: number) => {
        const { userId } = get();
        if (!userId) throw new Error("Not authenticated");

        const { error } = await supabase.rpc('deposit_to_wallet', {
          p_amount: amount
        });
          
        if (error) throw new Error(error.message);
        await get().fetchProfile();
      },





      checkAvailability: async (phone: string) => {
        const normalized = normalizePhone(phone);
        const email = phoneToEmail(phone);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .or(`email.eq.${email},phone.eq.${phone},phone.eq.${normalized}`);
          
        if (error) {
          return true;
        }
        
        return (data as any[])?.length === 0;
      },

      sendOtp: async (phone: string) => {
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: { phone }
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Failed to send SMS OTP.');
        }
        return true; 
      },

      verifyOtp: async (phone: string, token: string) => {
        const { data, error } = await supabase.functions.invoke('verify-otp', {
          body: { phone, otp: token }
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Incorrect code. Please try again.');
        }

        return data;
      },

      register: async (userData: any) => {
        const { name, phone, email: userEmail, pin, location, role, businessType, specializations, agent_account_type, fleet_invite_code, company_name, gender } = userData;
        const email = phoneToEmail(phone);
        
        let user: any = null;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: pin,
          options: { data: { full_name: name, phone } }
        });

        if (authError) {
          if ((authError as any).status === 422 || authError.message.includes('already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password: pin
            });
            
            if (signInError) throw new Error("Account exists with a different passcode. Please use Login or reset your PIN.");
            user = signInData.user;
          } else {
            throw authError;
          }
        } else {
          user = authData.user;
        }

        if (!user) throw new Error("Authentication failed. Please try again.");

        let companyId = null;
        if (agent_account_type === 'fleet_driver' && fleet_invite_code) {
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('fleet_invite_code', fleet_invite_code.toUpperCase())
            .single();
            
          if (adminError || !adminData) {
             throw new Error("Invalid Company Invite Code. Please verify with your Admin.");
          }
          companyId = (adminData as any).id;
        }

        const profileInsert: any = {
          id: user.id,
          email: userEmail || email,
          name,
          phone,
          location,
          estate: location?.estate,
          role: role || ROLES.USER,
          wallet_balance: 0,
          reward_points: 0,
          is_verified: true,
          company_name: company_name || null,
          gender: gender || null
        };

        if (role === ROLES.AGENT && agent_account_type) {
           profileInsert.agent_account_type = agent_account_type;
           // If they are a company admin, their profile stands alone. 
           // If they are a fleet driver, they must be approved. DO NOT set company_id yet.
        }

        if (role === ROLES.BUSINESS) {
          profileInsert.business_type = businessType || null;
          profileInsert.specializations = specializations || [];
        } else if (!role || role === ROLES.USER) {
          profileInsert.subscription_tier = 'free';
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileInsert]);

        if (profileError) throw profileError;

        // If fleet driver, insert into company_join_requests
        if (role === ROLES.AGENT && agent_account_type === 'fleet_driver' && companyId) {
           const { error: requestError } = await supabase
             .from('company_join_requests')
             .insert([{
                driver_id: user.id,
                company_id: companyId,
                status: 'pending'
             }]);
           
           if (requestError) console.error("Error creating join request:", requestError);
           
           // Notify admin
           await supabase.from('notifications').insert([{
             target_user: companyId,
             title: 'New Fleet Driver Request',
             body: `${name} has requested to join your fleet.`,
             type: 'info',
             is_read: false
           }]);
        }

        await get().fetchProfile();
        return true;
      },




      
      login: async (phone: string, pin: string, forcedRole?: UserRole) => {
        const email = phoneToEmail(phone);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pin });
        if (authError) throw new Error('Invalid credentials.');
        const user = authData.user;
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (profileError || !profileData) {
            await supabase.auth.signOut();
            throw new Error('Access Denied: Profile not found. Please register.');
          }

          if (forcedRole && (profileData as ProfileRow).role !== forcedRole) {
            await supabase.auth.signOut();
            throw new Error(`Access Denied: This account is registered as a ${(profileData as ProfileRow).role}. Please use the correct Klinflow app.`);
          }
          
        const uiProfile = get()._mapProfile(profileData as ProfileRow);
        if (!uiProfile) throw new Error('Profile corruption detected.');

        set({ 
          isAuthenticated: true, 
          token: authData.session?.access_token, 
          userId: user.id, 
          role: uiProfile.role || 'user', 
          profile: uiProfile, 
          rewardPoints: uiProfile.rewardPoints || 0, 
          walletBalance: uiProfile.walletBalance || 0, 
          notificationPrefs: uiProfile.notificationPrefs 
        });
        get().subscribeToProfileChanges(user.id);
      },

      getGFPMetrics: () => {
        const points = get().profile?.rewardPoints || 0;
        
        const tiers = [
          { name: 'Seedling', min: 0, max: 500, icon: '🌱' },
          { name: 'Sprout', min: 501, max: 2000, icon: '🌿' },
          { name: 'Oak', min: 2001, max: 5000, icon: '🌳' },
          { name: 'Forest Keeper', min: 5001, max: Infinity, icon: '🌲' }
        ];

        const currentTierIdx = tiers.findIndex(t => points <= t.max);
        const currentTier = tiers[currentTierIdx] || tiers[tiers.length - 1]!;
        const nextTier = tiers[currentTierIdx + 1] || null;

        let progress = 0;
        if (nextTier) {
          const range = nextTier.min - currentTier.min;
          const currentProgress = points - currentTier.min;
          progress = Math.min(100, Math.max(0, (currentProgress / range) * 100));
        } else {
          progress = 100;
        }

        return {
          tier: currentTier.name,
          icon: currentTier.icon,
          nextTier: nextTier ? nextTier.name : 'Max Level',
          progress,
          points
        };
      },

      checkAppRole: (currentApp: string) => { 
        set({ appRole: currentApp });
        const { profile, isAuthenticated } = get();
        if (isAuthenticated && profile) {
          const userRole = profile.role;
          const isAuthorized = 
            (currentApp === 'client' && (userRole === ROLES.USER || userRole === 'resident' || userRole === 'seller')) ||
            (currentApp === 'agent'  && userRole === ROLES.AGENT) ||
            (currentApp === 'business' && userRole === ROLES.BUSINESS) ||
            (currentApp === 'admin' && (userRole === ROLES.ADMIN || (profile as any).agentAccountType === 'company_admin')) ||
            !currentApp;

          if (!isAuthorized) {
             supabase.auth.signOut().then(() => {
               set({ isAuthenticated: false, profile: null });
             });
          }
        }
      },

      setSession: async (session: any) => {
        if (!session) {
          set({ isAuthenticated: false, token: null, profile: null, userId: null });
          return;
        }
        set({ isAuthenticated: true, token: session.access_token, userId: session.user.id });
        await get().fetchProfile();
      },





      refreshProfile: async () => {
        await get().fetchProfile();
      },





      getRole: () => {
        return (get().profile?.role as UserRole) || null;
      },

      hasRole: (role: UserRole) => {
        return get().profile?.role === role;
      },
    }),
    {
      name: 'cf_auth_session',
      partialize: (state) => {
        const { profileSubscription, ...rest } = state;
        return rest;
      }
    }
  )
);
