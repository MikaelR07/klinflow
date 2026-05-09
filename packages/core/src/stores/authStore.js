import { toast } from 'sonner';
/**
 * authStore.js — CleanFlow KE Supabase Authentication & Profile State
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@cleanflow/supabase';
import { ROLES } from '@cleanflow/constants';
import { compressImage } from '../utils/imageUtils.js';
import { useNotificationStore, NOTIFICATION_TYPES } from './notificationStore.js';

// ── Normalize phone for email mapping ─────────────────
export const normalizePhone = (num) => {
  const clean = (num || '').replace(/\D/g, ''); 
  if (clean.length === 10 && clean.startsWith('0')) {
    return '+254' + clean.slice(1);
  }
  if (clean.length >= 12 && clean.includes('254')) {
    return '+' + clean.replace('+', '');
  }
  return clean;
};

export const phoneToEmail = (phone) => `${normalizePhone(phone).replace('+', '')}@cleanflow.ke`;

export const getBusinessLabel = (type, mode = 'id') => {
  const labels = {
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
  const config = labels[type] || labels.other;
  return config[mode] || config.id;
};

function defaultNotifPrefs() {
  return {
    pickupReminders: true, aiInsights: true, rewardAlerts: true,
    emergencyAlerts: true, agentJobAlerts: true, systemAlerts: true,
    feedbackAlerts: true, dailyKpi: false, staffAlerts: true, channel: 'push',
  };
}

export const useAuthStore = create(
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
      isInitializing: true,

      initializeAuth: async () => {
        // Prevent concurrent initialization calls which cause Supabase lock timeouts
        if (!get().isInitializing && get().isAuthenticated) return;
        
        set({ isInitializing: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (profileData) {
              const uiProfile = get()._mapProfile(profileData);
              set({ 
                isAuthenticated: true, 
                userId: session.user.id, 
                profile: uiProfile,
                role: uiProfile.role
              });
              get().subscribeToProfileChanges(session.user.id);
            }
          } else {
            set({ isAuthenticated: false, token: null, profile: null, userId: null });
          }

          // Listen for session changes (Login/Logout) across tabs
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
              set({ isAuthenticated: false, token: null, profile: null, userId: null });
              // Clean up subscriptions
              if (get().profileSubscription) {
                supabase.removeChannel(get().profileSubscription);
                set({ profileSubscription: null });
              }
            } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
              // CROSS-TAB SYNC: Force re-fetch of profile to ensure fresh data on load
              if (true) { // Always fetch fresh profile to prevent stale localStorage data
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                if (profileData) {
                  // ── GLOBAL ROLE GATEKEEPER ──
                  const appRole = get().appRole;
                  const userRole = profileData.role;

                  // Define valid role mappings for each app
                  const isAuthorized = 
                    (appRole === 'client' && (userRole === 'user' || userRole === 'resident' || userRole === 'seller')) ||
                    (appRole === 'agent'  && userRole === 'agent') ||
                    (appRole === 'business' && userRole === 'business') ||
                    (appRole === 'admin' && (userRole === 'admin' || profileData.agent_account_type === 'company_admin')) ||
                    !appRole; // If no appRole set, allow all (e.g. for landing pages)

                  if (!isAuthorized) {
                    console.error(`[AuthGate] Unauthorized Access. User is ${userRole}, App is ${appRole}`);
                    await supabase.auth.signOut();
                    set({ isAuthenticated: false, profile: null });
                    return;
                  }

                  const uiProfile = get()._mapProfile(profileData);
                  set({ 
                    isAuthenticated: true, 
                    userId: session.user.id, 
                    profile: uiProfile,
                    role: uiProfile.role
                  });
                  get().subscribeToProfileChanges(session.user.id);
                }
              }
            }
          });
        } catch (err) {
          console.error('[CleanFlow Auth] Initialization failed:', err);
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
          const uiProfile = get()._mapProfile(profileData);
          set({ 
            profile: uiProfile,
            rewardPoints: uiProfile.rewardPoints,
            walletBalance: uiProfile.walletBalance
          });
        }
      },

      _mapProfile: (profileData) => ({
        ...profileData,
        idNumber: profileData.id_number,
        walletBalance: Number(profileData.wallet_balance || 0),
        rewardPoints: Number(profileData.reward_points || 0),
        subscriptionTier: profileData.role === ROLES.USER ? profileData.subscription_tier : null,
        isOnline: profileData.is_online,
        isStaff: profileData.is_staff === true, // Strict boolean
        fleetId: profileData.fleet_id,
        notificationPrefs: profileData.notification_prefs || defaultNotifPrefs(),
        completedClearedAt: profileData.completed_cleared_at,
        cancelledClearedAt: profileData.cancelled_cleared_at,
        isVerified: profileData.is_verified,
        businessType: profileData.role === ROLES.BUSINESS ? profileData.business_type : null,
        specializations: profileData.role === ROLES.BUSINESS ? (profileData.specializations || []) : null,
        nemaLicense: profileData.nema_license,
        companyName: profileData.company_name,
        gender: profileData.gender,
        notes: profileData.notes || '',
      }),

      subscribeToProfileChanges: async (uid) => {
        const id = uid || get().userId;
        if (!id) return;
        
        // ── CLEANUP PREVIOUS ──
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
        
        console.log('[AuthStore] Opening Profile Channel:', channelName);

        const channel = supabase.channel(channelName)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${id}` 
          }, (payload) => {
            const updated = payload.new;
            console.log('[AuthStore] LIVE PROFILE UPDATE RECEIVED:', updated);
            
            const currentProfile = get().profile;
            const newBalance = Number(updated.wallet_balance !== undefined ? updated.wallet_balance : currentProfile?.walletBalance || 0);
            const oldBalance = currentProfile?.walletBalance || 0;
            
            if (newBalance > oldBalance) {
              toast.success('Money Received! 💰', { 
                description: `KSh ${newBalance - oldBalance} has been added to your wallet.` 
              });
            }

            set({
              profile: {
                ...currentProfile,
                ...updated,
                idNumber: updated.id_number !== undefined ? updated.id_number : currentProfile?.idNumber,
                isStaff: updated.is_staff !== undefined ? (updated.is_staff === true) : currentProfile?.isStaff,
                fleetId: updated.fleet_id !== undefined ? updated.fleet_id : currentProfile?.fleetId,
                notes: updated.notes !== undefined ? updated.notes : currentProfile?.notes,
                companyName: updated.company_name !== undefined ? updated.company_name : currentProfile?.companyName,
                gender: updated.gender !== undefined ? updated.gender : currentProfile?.gender,
                walletBalance: newBalance,
                rewardPoints: Number(updated.reward_points !== undefined ? updated.reward_points : currentProfile?.rewardPoints || 0),
                notificationPrefs: updated.notification_prefs || currentProfile?.notificationPrefs,
              },
              rewardPoints: Number(updated.reward_points !== undefined ? updated.reward_points : currentProfile?.rewardPoints || 0),
              walletBalance: newBalance
            });
          })
          .subscribe((status) => {
             if (status === 'SUBSCRIBED') {
                console.log('[AuthStore] Profile monitoring active for:', id);
             }
          });
        
        set({ profileSubscription: channel });
      },

      topUpBalance: async (amount) => {
    const { userId, profile } = get();
    if (!userId) return;

    console.log(`[AuthStore] Simulating STK Push for KSh ${amount}...`);
    const newBalance = (profile?.balance || 0) + Number(amount);

    const { data, error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId)
      .select('*')
      .single();

    if (!error && data) {
      set({ profile: data });
      return true;
    }
    return false;
  },

  logout: async () => {
    const { profileSubscription } = get();
    
    // 1. Instantly cleanup realtime
    if (profileSubscription) {
      try {
        await supabase.removeChannel(profileSubscription);
      } catch (e) {
        console.warn('[AuthStore] Channel cleanup failed during logout', e);
      }
    }

    try {
      // 2. Clear server session (don't block for too long)
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthStore] Supabase signOut error:', err);
    } finally {
      // 3. ALWAYS clear local state regardless of server response
      set({ 
        isAuthenticated: false, 
        token: null, 
        role: ROLES.USER, 
        profile: null, 
        userId: null, 
        profileSubscription: null 
      });
      
      // 4. Force clear localStorage just in case middleware fails
      localStorage.removeItem('cf_auth_session');
    }
  },

      updateProfile: async (newData) => {
        const { userId, profile } = get();
        if (!userId) throw new Error("Not authenticated");
        
        const dbPayload = { ...newData };
        const VALID_COLUMNS = [
          'name', 'location', 'estate', 'avatar_url', 'id_number', 
          'business_type', 'business_name', 'specializations', 
          'nema_license', 'is_verified', 'is_online', 'is_staff', 'notification_prefs', 'notes',
          'subscription_tier'
        ];

        const sanitizedPayload = {};
        Object.entries(dbPayload).forEach(([key, value]) => {
          let dbKey = key;
          if (key === 'idNumber') dbKey = 'id_number';
          if (key === 'isStaff') dbKey = 'is_staff';
          if (key === 'nemaLicense') dbKey = 'nema_license';
          if (key === 'businessType') dbKey = 'business_type';
          
          if (VALID_COLUMNS.includes(dbKey)) {
            // DEEP SYNC: If updating location, ensure we don't send nulls if we have existing coords
            if (dbKey === 'location' && value) {
              const currentLoc = profile?.location || {};
              sanitizedPayload.location = {
                ...currentLoc,
                ...value,
                // Force numeric conversion to ensure DB compatibility
                latitude: value.latitude !== undefined ? Number(value.latitude) : currentLoc.latitude,
                longitude: value.longitude !== undefined ? Number(value.longitude) : currentLoc.longitude
              };
            } else {
              sanitizedPayload[dbKey] = value;
            }
          }
        });

        const { error } = await supabase.from('profiles').update(sanitizedPayload).eq('id', userId);
        if (error) throw new Error(error.message);
        
        // Update local state with the same merged logic
        set({ 
          profile: { 
            ...profile, 
            ...newData,
            location: sanitizedPayload.location || profile?.location
          } 
        });
      },

      uploadAvatar: async (file) => {
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

        await updateProfile({ avatar_url: publicUrl });
        return publicUrl;
      },

      toggleOnline: async (coords = null) => {
        const { userId, profile } = get();
        if (!userId) throw new Error("Not authenticated");
        
        const isGoingOnline = !profile.isOnline;
        const updatePayload = {
          is_online: isGoingOnline
        };

        if (isGoingOnline && coords) {
          updatePayload.location = {
            ...profile.location,
            latitude: coords.latitude,
            longitude: coords.longitude,
            status: 'active',
            last_pulse: new Date().toISOString()
          };
        }

        const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);
        if (error) throw new Error(error.message);
        
        set({ 
          profile: { 
            ...profile, 
            isOnline: isGoingOnline,
            location: updatePayload.location || profile.location
          } 
        });
      },

      withdrawRewards: async (amount) => {
        const { userId, walletBalance } = get();
        if (!userId) throw new Error("Not authenticated");
        if (amount > walletBalance) throw new Error("Insufficient funds");

        // Subtract from local wallet balance immediately for UI responsiveness
        const newBalance = walletBalance - amount;
        
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_balance: newBalance })
          .eq('id', userId);
          
        if (error) throw new Error(error.message);

        // Log the withdrawal in the rewards_ledger for tracking
        await supabase.from('rewards_ledger').insert({
          profile_id: userId,
          transaction_type: 'withdrawal',
          amount_cashback: -amount,
          description: `Withdrawal of KSh ${amount}`
        });

        set({ 
          walletBalance: newBalance,
          profile: { ...get().profile, walletBalance: newBalance }
        });
      },
      checkAvailability: async (phone) => {
        const normalized = normalizePhone(phone);
        const email = phoneToEmail(phone);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .or(`email.eq.${email},phone.eq.${phone},phone.eq.${normalized}`);
          
        if (error) {
          console.error('[AuthStore] Availability check failed:', error);
          return true; // Assume available on error to not block user, or handle as needed
        }
        
        return data?.length === 0;
      },

      sendOtp: async (phone) => {
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: { phone }
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Failed to send SMS OTP.');
        }
        return true; 
      },

      verifyOtp: async (phone, token) => {
        const { data, error } = await supabase.functions.invoke('verify-otp', {
          body: { phone, otp: token }
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Incorrect code. Please try again.');
        }

        return data;
      },

      register: async (userData) => {
        const { name, phone, email: userEmail, pin, location, clientType, role, businessType, specializations, agent_account_type, fleet_invite_code, company_name, gender } = userData;
        const email = phoneToEmail(phone);
        
        let user = null;

        // 1. Sign up the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: pin,
          options: { data: { full_name: name, phone } }
        });

        if (authError) {
          console.error('[AuthStore] SignUp Error Details:', {
            status: authError.status,
            message: authError.message,
            full: authError
          });
          
          // AUTO-REPAIR: If user already exists in Auth but registration was incomplete
          if (authError.status === 422 || authError.message.includes('already registered')) {
            console.log('[AuthStore] Orphaned account detected. Attempting auto-repair...');
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

        // 1.5 Resolve Company ID if they are a Fleet Driver
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
          companyId = adminData.id;
        }

        // 2. Create the profile record
        const profileInsert = {
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
           if (companyId) profileInsert.company_id = companyId;
        }

        if (role === ROLES.BUSINESS) {
          profileInsert.business_type = businessType || null;
          profileInsert.specializations = specializations || [];
        } else if (!role || role === ROLES.USER) {
          profileInsert.subscription_tier = 'free'; // default tier
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileInsert]);

        if (profileError) throw profileError;

        // 3. Update local state
        const profile = { 
          id: user.id, name, phone, email: userEmail || email, location, 
          role: role || ROLES.USER, 
          businessType: role === ROLES.BUSINESS ? (businessType || null) : null,
          specializations: role === ROLES.BUSINESS ? (specializations || []) : null,
          clientType: (!role || role === ROLES.USER) ? (clientType || 'resident') : null,
          subscriptionTier: (!role || role === ROLES.USER) ? 'free' : null,
          walletBalance: 0, rewardPoints: 0 
        };
        
        set({ 
          isAuthenticated: true, 
          userId: user.id, 
          profile, 
          role: role || ROLES.USER
        });
        
        get().subscribeToProfileChanges(user.id);
        return true;
      },
      
      login: async (phone, pin, forcedRole) => {

        const email = phoneToEmail(phone);
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pin });
        if (authError) throw new Error('Invalid credentials.');
        const user = authData.user;
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (profileError || !profileData) {
            await supabase.auth.signOut();
            throw new Error('Access Denied: Profile not found. Please register.');
          }

          // ── ROLE ENFORCEMENT ──
          // Prevent residents from logging into agent apps and vice versa
          if (forcedRole && profileData.role !== forcedRole) {
            console.warn('[AuthStore] Role Mismatch. Expected:', forcedRole, 'Got:', profileData.role);
            await supabase.auth.signOut();
            throw new Error(`Access Denied: This account is registered as a ${profileData.role}. Please use the correct CleanFlow app.`);
          }
          
        const uiProfile = get()._mapProfile(profileData);
        set({ 
          isAuthenticated: true, 
          token: authData.session?.access_token, 
          userId: user.id, 
          role: uiProfile.role, 
          profile: uiProfile, 
          rewardPoints: uiProfile.rewardPoints, 
          walletBalance: uiProfile.walletBalance, 
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
        const currentTier = tiers[currentTierIdx] || tiers[tiers.length - 1];
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

      appRole: null,
      checkAppRole: (currentApp) => { 
        set({ appRole: currentApp });
        const { profile, isAuthenticated } = get();
        if (isAuthenticated && profile) {
          const userRole = profile.role;
          const isAuthorized = 
            (currentApp === 'client' && (userRole === 'user' || userRole === 'resident' || userRole === 'seller')) ||
            (currentApp === 'agent'  && userRole === 'agent') ||
            (currentApp === 'business' && userRole === 'business') ||
            (currentApp === 'admin' && (userRole === 'admin' || profile.agent_account_type === 'company_admin')) ||
            !currentApp;

          if (!isAuthorized) {
             supabase.auth.signOut().then(() => {
               set({ isAuthenticated: false, profile: null });
             });
          }
        }
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
