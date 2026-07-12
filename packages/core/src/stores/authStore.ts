import { toast } from 'sonner';
/**
 * authStore.ts — Klinflow KE Supabase Authentication & Profile State
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { ROLES } from '@klinflow/constants';
import { UserRole, HubRole, MembershipRole, HubPermission } from '@klinflow/types';
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
      _isLoggingIn: false,
      
      // Hub Multi-Role Properties (from implementation plan)
      currentCompanyId: '',
      currentCompanyName: '',
      membershipRole: 'member', // default to member
      hubRoles: [], // department responsibilities
      hubPermissions: [],

      // Session / Hydration
      initializeAuth: async () => {
        if (get().isInitializing) return;
        set({ isInitializing: true });
        try {
          // Always validate the Supabase session — even if persisted state says authenticated
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // Session is valid — refresh profile from server (not from stale persist)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileData) {
              const uiProfile = get()._mapProfile(profileData as ProfileRow);
              if (uiProfile) {
                // Fetch hub data BEFORE setting isAuthenticated to prevent flash
                set({ userId: session.user.id });
                await get().fetchHubData();

                set({ 
                  isAuthenticated: true, 
                  userId: session.user.id, 
                  profile: uiProfile,
                  role: uiProfile.role || 'user',
                  token: session.access_token,
                });
                get().subscribeToProfileChanges(session.user.id);
              } else {
                // Profile validation failed — clear everything
                set({ isAuthenticated: false, token: null, profile: null, userId: null,
                  currentCompanyId: '', currentCompanyName: '', membershipRole: 'member',
                  hubRoles: [], hubPermissions: [] });
              }
            } else {
              // No profile row — sign out the Supabase session too
              await supabase.auth.signOut();
              set({ isAuthenticated: false, token: null, profile: null, userId: null,
                currentCompanyId: '', currentCompanyName: '', membershipRole: 'member',
                hubRoles: [], hubPermissions: [] });
            }
          } else {
            // No valid Supabase session — clear persisted state
            set({ isAuthenticated: false, token: null, profile: null, userId: null,
              currentCompanyId: '', currentCompanyName: '', membershipRole: 'member',
              hubRoles: [], hubPermissions: [] });
          }

          // Always set up visibility listener (de-duped via window flag)
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
                      toast.error('Session Expired', { description: 'Your session has expired. Please sign in again.' });
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
                    toast.error('Account Error', { description: 'Your account could not be verified. Please sign in again.' });
                  }
                } catch (e) {
                  console.warn('[AuthGate] Background sync failed:', e);
                }
              }
            });
          }

          // Always set up auth state listener (de-duped internally by Supabase)
          supabase.auth.onAuthStateChange(async (event, session) => {
            // Skip events fired during an explicit login() call — login() manages its own state
            if (get()._isLoggingIn) return;

            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              set({ isAuthenticated: false, token: null, profile: null, userId: null,
                currentCompanyId: '', currentCompanyName: '', membershipRole: 'member',
                hubRoles: [], hubPermissions: [] });
              if (get().profileSubscription) {
                supabase.removeChannel(get().profileSubscription);
                set({ profileSubscription: null });
              }
            } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              if (get().isAuthenticated) return;

              const { data: profileData } = await supabase
                .from('profiles')
                .select('*, user_wallets(cash_balance, available_points)')
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

                // Fetch hub data before setting authenticated
                set({ userId: session.user.id });
                await get().fetchHubData();

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
          // On init failure, clear everything so user gets a clean login
          set({ isAuthenticated: false, token: null, profile: null, userId: null,
            currentCompanyId: '', currentCompanyName: '', membershipRole: 'member',
            hubRoles: [], hubPermissions: [] });
        } finally {
          set({ isInitializing: false });
        }
      },

      // Hub Multi-Role Methods (from implementation plan)
      fetchHubData: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          // Get user's company memberships via RPC
          const { data: companies, error: companiesError } = await supabase.rpc('rpc_get_user_companies' as any);
          if (companiesError) throw companiesError;

          if (companies && companies.length > 0) {
            // User has at least one company - select the first one for now
            const company = companies[0] as any;
            
            // Get their membership role (owner/member)
            const { data: membershipData, error: membershipError } = await supabase
              .rpc('rpc_get_user_membership_role' as any, { p_company_id: company.id });
            if (membershipError) throw membershipError;
            
            // Aggressive parsing to ensure 'owner' is caught regardless of how Supabase JS returns it
            let membershipRole = 'member';
            if (membershipData === 'owner') membershipRole = 'owner';
            else if (Array.isArray(membershipData) && membershipData[0]?.membership_role === 'owner') membershipRole = 'owner';
            else if ((membershipData as any)?.membership_role === 'owner') membershipRole = 'owner';

            // Get their specific hub roles (finance_manager, etc)
            const { data: rolesData, error: rolesError } = await supabase
              .rpc('rpc_get_my_hub_roles' as any, { p_company_id: company.id });
            if (rolesError) throw rolesError;
            const hubRoles = (rolesData as any)?.map((r: any) => r.role) || [];

            set({
              currentCompanyId: company.id,
              currentCompanyName: company.name,
              membershipRole: membershipRole as MembershipRole,
              hubRoles: hubRoles as HubRole[],
            });

            // Get permissions
            const { data: permissions, error: permissionsError } = await supabase
              .rpc('rpc_get_my_hub_permissions' as any, { p_company_id: company.id });
            if (permissionsError) throw permissionsError;
            const hubPermissions = (permissions as any)?.map((p: any) => p.permission) || [];
            
            set({ hubPermissions: hubPermissions as HubPermission[] });
          } else {
            // No company memberships found
            set({
              currentCompanyId: '',
              currentCompanyName: '',
              membershipRole: 'member',
              hubRoles: [],
              hubPermissions: [],
            });
          }
        } catch (error) {
          console.error('Error fetching hub data:', error);
          // Set default values on error
          set({
            currentCompanyId: '',
            currentCompanyName: '',
            membershipRole: 'member',
            hubRoles: [],
            hubPermissions: [],
          });
        }
      },

      hasHubRole: (role: HubRole) => {
        return get().hubRoles.includes(role);
      },

      hasHubPermission: (perm: HubPermission) => {
        return get().hubPermissions.includes(perm);
      },

      fetchProfile: async () => {
        const { userId } = get();
        if (!userId) return;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, user_wallets(cash_balance, available_points)')
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

      _mapProfile: (profileData: any): Profile | null => {
        const normalized = normalizeKeys(profileData);
        
        // Extract wallet values from the joined user_wallets table if it exists
        const userWallet = profileData.user_wallets && Array.isArray(profileData.user_wallets) 
          ? profileData.user_wallets[0] 
          : profileData.user_wallets;

        // Ensure strictly typed fields for monetary values
        normalized.walletBalance = userWallet ? Number(userWallet.cash_balance || 0) : Number(profileData.wallet_balance || 0);
        normalized.rewardPoints = userWallet ? Number(userWallet.available_points || 0) : Number(profileData.reward_points || 0);
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
          }, async () => {
            await get().fetchProfile();
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'user_wallets', 
            filter: `user_id=eq.${id}` 
          }, async () => {
            await get().fetchProfile();
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
        
        // Clear ALL state atomically — including hub data
        set({ 
          isAuthenticated: false, 
          token: null, 
          role: ROLES.USER, 
          profile: null, 
          userId: null, 
          profileSubscription: null,
          currentCompanyId: '',
          currentCompanyName: '',
          membershipRole: 'member',
          hubRoles: [],
          hubPermissions: [],
          _isLoggingIn: false,
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
          // Ignore sign-out errors
        }
      },

      deleteAccount: async () => {
        const { userId, logout } = get();
        if (!userId) throw new Error("Not authenticated");
        
        const { error } = await supabase.rpc('delete_own_user');
        if (error) throw new Error(error.message);
        
        await logout();
      },

      changePin: async (currentPin: string, newPin: string) => {
        const { profile } = get();
        if (!profile?.phone) throw new Error("Profile not loaded.");
        const email = phoneToEmail(profile.phone);
        
        // 1. Verify current PIN
        const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPin });
        if (verifyError) throw new Error('Incorrect current PIN.');
        
        // 2. Update to new PIN
        const { error: updateError } = await supabase.auth.updateUser({ password: newPin });
        if (updateError) throw new Error(updateError.message);
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

        const { data: { publicUrl } } = await supabase.storage
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

      resetPin: async (phone: string, otp: string, newPin: string) => {
        const { data, error } = await supabase.functions.invoke('reset-pin', {
          body: { phone, otp, newPin }
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Failed to reset PIN. Please try again.');
        }
        return data;
      },

      register: async (userData: any) => {
        const { name, phone, email: userEmail, pin, location, role, businessType, specializations, agent_account_type, fleet_invite_code, company_name, gender, documents } = userData;
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
          // Find the admin profile first
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('id')
            .eq('fleet_invite_code', fleet_invite_code.toUpperCase())
            .single();
          
          if (adminError || !adminData) {
            throw new Error("Invalid Company Invite Code. Please verify with your Admin.");
          }
          
          // Then find their Hub company
          const { data: userCompanyData, error: userCompanyError } = await supabase
            .from('user_companies')
            .select('company_id')
            .eq('user_id', (adminData as any).id)
            .eq('membership_role', 'owner')
            .maybeSingle();

          if (userCompanyError || !userCompanyData) {
            throw new Error("Company Admin has not yet set up their Hub organization.");
          }
          
          companyId = (userCompanyData as any).company_id;
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

        // If they are a company owner, instantly provision their Hub organization
        if (role === ROLES.AGENT && agent_account_type === 'company_admin') {
          const { error: rpcError } = await supabase.rpc('rpc_setup_hub_company', {
            p_company_name: company_name || 'My Company',
            p_owner_id: user.id
          });
          
          if (rpcError) {
             console.error("Failed to provision Hub company:", rpcError);
          }
        }

        // If fleet driver, insert into company_join_requests
        if (role === ROLES.AGENT && agent_account_type === 'fleet_driver' && companyId) {
           let submittedDocsMap: Record<string, string> = {};
           let documentsUploadedCount = 0;

           // Upload Documents
           if (documents && Object.keys(documents).length > 0) {
             for (const [docName, file] of Object.entries(documents)) {
               try {
                 const fileExt = (file as File).name.split('.').pop();
                 const fileName = `${docName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
                 const filePath = `${companyId}/${user.id}/${fileName}`;
                 
                 const { error: uploadError } = await supabase.storage
                   .from('agent_documents')
                   .upload(filePath, file as File);
                 
                 if (!uploadError) {
                   const { data: { publicUrl } } = await supabase.storage
                     .from('agent_documents')
                     .getPublicUrl(filePath);
                   submittedDocsMap[docName] = publicUrl;
                   documentsUploadedCount++;
                 }
               } catch (err) {
                 console.error(`Failed to upload ${docName}:`, err);
               }
             }
           }

           const { error: requestError } = await supabase
             .from('company_join_requests')
             .insert([{
                driver_id: user.id,
                company_id: companyId,
                status: 'pending',
                submitted_documents: submittedDocsMap,
                documents_complete: documentsUploadedCount
             }]);
           
           if (requestError) console.error("Error creating join request:", requestError);
           
           // Notify admin
           await supabase.from('notifications').insert([{
             target_user: companyId,
             title: 'New Fleet Driver Request',
             body: `${name} has requested to join your fleet and submitted ${documentsUploadedCount} document(s).`,
             type: 'info',
             is_read: false
           }]);
        }

        await get().fetchProfile();
        return true;
      },



      login: async (phone: string, pin: string, forcedRole?: UserRole | string | string[]) => {
        const email = phoneToEmail(phone);

        // Set flag to suppress onAuthStateChange listener during login
        set({ _isLoggingIn: true });

        try {
          // Clear any stale session before authenticating
          try { await supabase.auth.signOut(); } catch (_) {}

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pin });
          if (authError) {
            // Provide user-friendly error messages
            const msg = authError.message?.toLowerCase() || '';
            if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password')) {
              throw new Error('Incorrect phone number or PIN. Please try again.');
            }
            if (msg.includes('email not confirmed')) {
              throw new Error('Your account is pending verification. Please contact support.');
            }
            if (msg.includes('too many requests') || msg.includes('rate limit')) {
              throw new Error('Too many login attempts. Please wait a moment and try again.');
            }
            if (msg.includes('user not found') || msg.includes('no user')) {
              throw new Error('No account found with this phone number.');
            }
            throw new Error('Authentication failed. Please check your credentials and try again.');
          }

          const user = authData.user;
          const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (profileError || !profileData) {
            await supabase.auth.signOut();
            throw new Error('No Klinflow profile found for this account. Please register first.');
          }

          if (forcedRole) {
            const isRoleValid = Array.isArray(forcedRole)
              ? forcedRole.includes((profileData as ProfileRow).role)
              : (profileData as ProfileRow).role === forcedRole;

            if (!isRoleValid) {
              await supabase.auth.signOut();
              throw new Error('Your account does not have access to this application.');
            }
          }

          const uiProfile = get()._mapProfile(profileData as ProfileRow);
          if (!uiProfile) {
            await supabase.auth.signOut();
            throw new Error('Your profile data could not be loaded. Please contact support.');
          }

          // Fetch Hub multi-tenant data BEFORE setting isAuthenticated
          // This prevents the flash where isAuthenticated=true but currentCompanyId=''
          set({ userId: user.id });
          await get().fetchHubData();

          // Now set everything atomically — React will only see the final state
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
        } finally {
          // Always clear the login flag
          set({ _isLoggingIn: false });
        }
      },

      refreshProfile: async () => {
        await get().fetchProfile();
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


      getRole: () => {
        return (get().profile?.role as UserRole) || null;
      },

      hasRole: (role: UserRole) => {
        return get().profile?.role === role;
      },
    }),
    {
      name: 'cf_auth_session',
      partialize: (state) => ({
        // Only persist essential session data — hub data is always fetched fresh
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        userId: state.userId,
        role: state.role,
        profile: state.profile,
        appRole: state.appRole,
        notificationPrefs: state.notificationPrefs,
      })
    }
  )
);
