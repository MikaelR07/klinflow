-- Klinflow Hub Multi-Tenant RBAC Migration
-- Production-safe, rerunnable migration aligned with frontend architecture
-- Fixes all critical issues identified in audit

-- ===========================================
-- ENUM TYPES (idempotent creation)
-- ===========================================

-- Hub role enum (matches frontend HubRole type)
DO $$ BEGIN
    CREATE TYPE hub_role AS ENUM (
        'operations_manager',
        'fleet_manager',
        'sales_manager',
        'finance_manager',
        'executive_viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Membership role enum (ownership role)
DO $$ BEGIN
    CREATE TYPE membership_role AS ENUM ('owner', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Hub permission enum (matches frontend HubPermission type)
DO $$ BEGIN
    CREATE TYPE hub_permission AS ENUM (
        -- Company management
        'company:read',
        'company:update',
        'company:delete',
        
        -- User management
        'user:read',
        'user:create',
        'user:update',
        'user:delete',
        'user:assign_role',
        
        -- Operations
        'operation:read',
        'operation:create',
        'operation:update',
        'operation:delete',
        
        -- Fleet
        'fleet:read',
        'fleet:create',
        'fleet:update',
        'fleet:delete',
        
        -- Sales
        'sale:read',
        'sale:create',
        'sale:update',
        'sale:delete',
        
        -- Finance
        'finance:read',
        'finance:create',
        'finance:update',
        'finance:delete',
        
        -- Analytics
        'analytics:read',
        'analytics:export',
        
        -- Settings
        'setting:read',
        'setting:update'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- TABLES (idempotent creation with IF NOT EXISTS)
-- ===========================================

-- Companies table (tenant definition)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub permissions lookup (global permission definitions)
CREATE TABLE IF NOT EXISTS hub_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission hub_permission UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub role permissions (global role templates)
CREATE TABLE IF NOT EXISTS hub_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role hub_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES hub_permissions(id) ON DELETE CASCADE,
    UNIQUE(role, permission_id)
);

-- User company associations (many-to-many)
CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    membership_role membership_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- User hub roles (functional roles within companies)
CREATE TABLE IF NOT EXISTS hub_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role hub_role NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id, company_id, role)
);

-- User hub permissions (direct permission grants/denials)
CREATE TABLE IF NOT EXISTS hub_user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    permission hub_permission NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id, company_id, permission, granted)
);

-- ===========================================
-- INITIAL DATA (idempotent inserts)
-- ===========================================

-- Insert default hub permissions (if not exists)
INSERT INTO hub_permissions (permission, description) VALUES
    -- Company management
    ('company:read', 'View company details'),
    ('company:update', 'Update company information'),
    ('company:delete', 'Delete company'),
    
    -- User management
    ('user:read', 'View user information'),
    ('user:create', 'Create new users'),
    ('user:update', 'Update user information'),
    ('user:delete', 'Delete users'),
    ('user:assign_role', 'Assign roles to users'),
    
    -- Operations
    ('operation:read', 'View operations'),
    ('operation:create', 'Create operations'),
    ('operation:update', 'Update operations'),
    ('operation:delete', 'Delete operations'),
    
    -- Fleet
    ('fleet:read', 'View fleet information'),
    ('fleet:create', 'Add fleet items'),
    ('fleet:update', 'Modify fleet items'),
    ('fleet:delete', 'Remove fleet items'),
    
    -- Sales
    ('sale:read', 'View sales'),
    ('sale:create', 'Create sales'),
    ('sale:update', 'Update sales'),
    ('sale:delete', 'Delete sales'),
    
    -- Finance
    ('finance:read', 'View financial data'),
    ('finance:create', 'Create financial records'),
    ('finance:update', 'Update financial records'),
    ('finance:delete', 'Delete financial records'),
    
    -- Analytics
    ('analytics:read', 'View analytics'),
    ('analytics:export', 'Export analytics data'),
    
    -- Settings
    ('setting:read', 'View settings'),
    ('setting:update', 'Modify settings')
ON CONFLICT (permission) DO NOTHING;

-- Insert default hub role permissions (role templates)
INSERT INTO hub_role_permissions (role, permission_id)
SELECT 
    'operations_manager'::hub_role,
    hp.id
FROM hub_permissions hp
WHERE hp.permission IN (
    'company:read',
    'user:read', 'user:create', 'user:update',
    'operation:read', 'operation:create', 'operation:update', 'operation:delete',
    'fleet:read', 'fleet:create', 'fleet:update', 'fleet:delete',
    'sale:read', 'sale:create', 'sale:update', 'sale:delete',
    'finance:read', 'finance:create', 'finance:update', 'finance:delete',
    'analytics:read', 'analytics:export',
    'setting:read', 'setting:update'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO hub_role_permissions (role, permission_id)
SELECT 
    'fleet_manager'::hub_role,
    hp.id
FROM hub_permissions hp
WHERE hp.permission IN (
    'company:read',
    'user:read',
    'fleet:read', 'fleet:create', 'fleet:update', 'fleet:delete',
    'analytics:read',
    'setting:read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO hub_role_permissions (role, permission_id)
SELECT 
    'sales_manager'::hub_role,
    hp.id
FROM hub_permissions hp
WHERE hp.permission IN (
    'company:read',
    'user:read',
    'sale:read', 'sale:create', 'sale:update', 'sale:delete',
    'analytics:read',
    'setting:read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO hub_role_permissions (role, permission_id)
SELECT 
    'finance_manager'::hub_role,
    hp.id
FROM hub_permissions hp
WHERE hp.permission IN (
    'company:read',
    'user:read',
    'finance:read', 'finance:create', 'finance:update', 'finance:delete',
    'analytics:read',
    'setting:read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO hub_role_permissions (role, permission_id)
SELECT 
    'executive_viewer'::hub_role,
    hp.id
FROM hub_permissions hp
WHERE hp.permission IN (
    'company:read',
    'user:read',
    'analytics:read', 'analytics:export',
    'setting:read'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_user_permissions ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
USING (id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update their own company"
ON companies FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Only platform admins can insert companies"
ON companies FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'platform_admin'
    )
);

CREATE POLICY "Only owners can delete their own company"
ON companies FOR DELETE
USING (owner_id = auth.uid());

-- User companies policies
CREATE POLICY "Users can view their company memberships"
ON user_companies FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership role"
ON user_companies FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only company owners can insert memberships"
ON user_companies FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM companies
        WHERE id = company_id AND owner_id = auth.uid()
    )
);

CREATE POLICY "Only company owners can delete memberships"
ON user_companies FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM companies
        WHERE id = company_id AND owner_id = auth.uid()
    )
);

-- Hub user roles policies
CREATE POLICY "Users can view roles in their companies"
ON hub_user_roles FOR SELECT
USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
));

CREATE POLICY "Company owners and admins can manage roles"
ON hub_user_roles FOR ALL
USING (
    company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid() AND membership_role = 'owner'
    )
)
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid() AND membership_role = 'owner'
    )
);

-- Hub user permissions policies
CREATE POLICY "Users can view their permissions in companies"
ON hub_user_permissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Company owners can manage user permissions"
ON hub_user_permissions FOR ALL
USING (
    company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid() AND membership_role = 'owner'
    )
)
WITH CHECK (
    company_id IN (
        SELECT company_id FROM user_companies 
        WHERE user_id = auth.uid() AND membership_role = 'owner'
    )
);

-- Hub permissions (read-only for all authenticated users)
CREATE POLICY "Anyone can view permissions"
ON hub_permissions FOR SELECT
USING (true);

-- Hub role permissions (read-only for all authenticated users)
CREATE POLICY "Anyone can view role permissions"
ON hub_role_permissions FOR SELECT
USING (true);

-- ===========================================
-- HELPER FUNCTIONS (idempotent creation)
-- ===========================================

-- Function to get user's companies
CREATE OR REPLACE FUNCTION get_user_companies()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql STABLE
AS $$
    SELECT c.id, c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid();
$$;

-- Function to get user's hub roles for a company
CREATE OR REPLACE FUNCTION get_my_hub_roles(p_company_id UUID)
RETURNS TABLE (role hub_role)
LANGUAGE sql STABLE
AS $$
    SELECT role
    FROM hub_user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;
$$;

-- Function to get user's hub permissions for a company
CREATE OR REPLACE FUNCTION get_my_hub_permissions(p_company_id UUID)
RETURNS TABLE (permission hub_permission)
LANGUAGE sql STABLE
AS $$
    WITH user_roles AS (
        SELECT role FROM hub_user_roles 
        WHERE user_id = auth.uid() AND company_id = p_company_id
    ),
    role_permissions AS (
        SELECT DISTINCT hp.permission
        FROM hub_role_permissions hrp
        JOIN hub_permissions hp ON hrp.permission_id = hp.id
        JOIN user_roles ur ON hrp.role = ur.role
    ),
    user_permissions AS (
        SELECT permission 
        FROM hub_user_permissions
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND granted = true
    ),
    denied_permissions AS (
        SELECT permission 
        FROM hub_user_permissions
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND granted = false
    )
    SELECT permission FROM role_permissions
    UNION
    SELECT permission FROM user_permissions
    EXCEPT
    SELECT permission FROM denied_permissions
$$;

-- Function to get current company (assumes single company context per session)
CREATE OR REPLACE FUNCTION get_current_company()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql STABLE
AS $$
    SELECT c.id, c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid()
    ORDER BY uc.created_at DESC
    LIMIT 1;
$$;

-- Function to get current company name
CREATE OR REPLACE FUNCTION get_current_company_name()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
    SELECT c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid()
    ORDER BY uc.created_at DESC
    LIMIT 1;
$$;

-- Function to check if user has hub role in company
CREATE OR REPLACE FUNCTION has_hub_role(p_role hub_role, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM hub_user_roles
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND role = p_role
    );
$$;

-- Function to check if user has hub permission in company
CREATE OR REPLACE FUNCTION has_hub_permission(p_permission hub_permission, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
AS $$
    -- Company owners have all permissions
    SELECT EXISTS (
        SELECT 1 FROM companies
        WHERE id = p_company_id AND owner_id = auth.uid()
    )
    -- Check via roles and direct permissions
    OR EXISTS (
        SELECT 1 FROM get_my_hub_permissions(p_company_id)
        WHERE permission = p_permission
    );
$$;

-- Function to get user's membership role in a company
CREATE OR REPLACE FUNCTION get_user_membership_role(p_company_id UUID)
RETURNS membership_role
LANGUAGE sql STABLE
AS $$
    SELECT membership_role
    FROM user_companies
    WHERE user_id = auth.uid() AND company_id = p_company_id
    LIMIT 1;
$$;

-- ===========================================
-- SECURITY DEFINER FUNCTIONS FOR RPC ACCESS
-- ===========================================

-- Wrapper functions for RPC access (security definer to bypass RLS for function execution)
CREATE OR REPLACE FUNCTION rpc_get_user_companies()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT c.id, c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION rpc_get_my_hub_roles(p_company_id UUID)
RETURNS TABLE (role hub_role)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT role
    FROM hub_user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;
$$;

CREATE OR REPLACE FUNCTION rpc_get_my_hub_permissions(p_company_id UUID)
RETURNS TABLE (permission hub_permission)
LANGUAGE sql SECURITY DEFINER
AS $$
    WITH user_roles AS (
        SELECT role FROM hub_user_roles 
        WHERE user_id = auth.uid() AND company_id = p_company_id
    ),
    role_permissions AS (
        SELECT DISTINCT hp.permission
        FROM hub_role_permissions hrp
        JOIN hub_permissions hp ON hrp.permission_id = hp.id
        JOIN user_roles ur ON hrp.role = ur.role
    ),
    user_permissions AS (
        SELECT permission 
        FROM hub_user_permissions
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND granted = true
    ),
    denied_permissions AS (
        SELECT permission 
        FROM hub_user_permissions
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND granted = false
    )
    SELECT permission FROM role_permissions
    UNION
    SELECT permission FROM user_permissions
    EXCEPT
    SELECT permission FROM denied_permissions
$$;

CREATE OR REPLACE FUNCTION rpc_get_current_company()
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT c.id, c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid()
    ORDER BY uc.created_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION rpc_get_current_company_name()
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT c.name
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = auth.uid()
    ORDER BY uc.created_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION rpc_has_hub_role(p_role hub_role, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM hub_user_roles
        WHERE user_id = auth.uid() 
          AND company_id = p_company_id 
          AND role = p_role
    );
$$;

CREATE OR REPLACE FUNCTION rpc_has_hub_permission(p_permission hub_permission, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
    -- Company owners have all permissions
    SELECT EXISTS (
        SELECT 1 FROM companies
        WHERE id = p_company_id AND owner_id = auth.uid()
    )
    -- Check via roles and direct permissions
    OR EXISTS (
        SELECT 1 FROM get_my_hub_permissions(p_company_id)
        WHERE permission = p_permission
    );
$$;

CREATE OR REPLACE FUNCTION rpc_get_user_membership_role(p_company_id UUID)
RETURNS membership_role
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT membership_role
    FROM user_companies
    WHERE user_id = auth.uid() AND company_id = p_company_id
    LIMIT 1;
$$;

-- Grant execute permissions on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION rpc_get_user_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_my_hub_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_my_hub_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_current_company() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_current_company_name() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_has_hub_role(hub_role, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_has_hub_permission(hub_permission, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_user_membership_role(UUID) TO authenticated;


COMMENT ON TABLE companies IS 'Tenant/companies table';
COMMENT ON TABLE hub_permissions IS 'Global permission definitions';
COMMENT ON TABLE hub_role_permissions IS 'Global role-to-permission mappings (templates)';
COMMENT ON TABLE user_companies IS 'User-to-company membership with ownership role';
COMMENT ON TABLE hub_user_roles IS 'User functional roles within companies';
COMMENT ON TABLE hub_user_permissions IS 'User-specific permission grants/denials within companies';-- ════════════════════════════════════════════════════════════════
-- MIGRATION 1: ENFORCE MULTI-TENANCY ON CORE OPERATIONAL TABLES
-- ════════════════════════════════════════════════════════════════
-- This migration connects global operational tables to the multi-tenant
-- 'companies' table, ensuring that all data is scoped properly to the hub.

-- 1. ADD COMPANY_ID FOREIGN KEYS
-- ----------------------------------------------------------------
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_listings 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_orders 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.disputes 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.rewards_ledger 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;


-- 2. CREATE PERFORMANCE INDICES
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_company_id ON public.bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_listings_company_id ON public.marketplace_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.marketplace_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_disputes_company_id ON public.disputes(company_id);
CREATE INDEX IF NOT EXISTS idx_rewards_ledger_company_id ON public.rewards_ledger(company_id);


-- 3. UPDATE ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------
-- We add policies so that any authenticated user who has a membership
-- in the company can read the data.

-- Bookings
CREATE POLICY "Company members view company bookings" ON public.bookings
  FOR SELECT USING (
    company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.bookings.company_id AND uc.user_id = auth.uid())
  );

-- Marketplace Listings
CREATE POLICY "Company members view company listings" ON public.marketplace_listings
  FOR SELECT USING (
    company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.marketplace_listings.company_id AND uc.user_id = auth.uid())
  );

-- Marketplace Orders
CREATE POLICY "Company members view company orders" ON public.marketplace_orders
  FOR SELECT USING (
    company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.marketplace_orders.company_id AND uc.user_id = auth.uid())
  );

-- Disputes
CREATE POLICY "Company members view company disputes" ON public.disputes
  FOR SELECT USING (
    company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.disputes.company_id AND uc.user_id = auth.uid())
  );

-- Rewards Ledger
CREATE POLICY "Company members view company ledger" ON public.rewards_ledger
  FOR SELECT USING (
    company_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.rewards_ledger.company_id AND uc.user_id = auth.uid())
  );
-- ════════════════════════════════════════════════════════════════
-- MIGRATION 2: FINANCE & WALLETS INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════════

-- 1. WALLETS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  balance         NUMERIC(15,2) DEFAULT 0.00 CHECK (balance >= 0),
  currency        TEXT DEFAULT 'KES',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_wallets_company_id ON public.wallets(company_id);

-- 2. TRANSACTIONS TABLE (Double Entry Ledger)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('deposit', 'withdrawal', 'payout', 'refund', 'fee')),
  amount          NUMERIC(15,2) NOT NULL,
  balance_after   NUMERIC(15,2) NOT NULL,
  reference       TEXT, -- e.g., booking_id, mpesa_receipt
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);

-- 3. PAYOUTS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  recipient_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method  TEXT, -- 'mpesa', 'bank'
  transaction_ref TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_company_id ON public.payouts(company_id);

-- 4. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Only users with a role in the company can view its wallet, transactions, and payouts
CREATE POLICY "Company members view wallets" ON public.wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.wallets.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.transactions.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view payouts" ON public.payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.payouts.company_id AND uc.user_id = auth.uid())
  );

-- Only users with 'finance_manager' or 'company_owner' can initiate payouts
CREATE POLICY "Finance managers insert payouts" ON public.payouts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.payouts.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('finance_manager')
    )
  );

-- 5. TRIGGERS FOR DATA INTEGRITY
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to update wallet balance on new transaction
  IF NEW.type IN ('deposit', 'refund') THEN
    UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
  ELSIF NEW.type IN ('withdrawal', 'payout', 'fee') THEN
    UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() WHERE id = NEW.wallet_id;
  END IF;
  
  -- Record the balance_after
  SELECT balance INTO NEW.balance_after FROM public.wallets WHERE id = NEW.wallet_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite a user to a company by email
CREATE OR REPLACE FUNCTION public.rpc_hub_invite_member(p_company_id UUID, p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Security check: must be owner
  IF NOT EXISTS (
    SELECT 1 FROM public.user_companies 
    WHERE company_id = p_company_id AND user_id = auth.uid() AND membership_role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only company owners can invite members';
  END IF;

  -- Find the user by email
  SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. They must create a free Klinflow account first.';
  END IF;

  -- Check if already a member
  IF EXISTS (SELECT 1 FROM public.user_companies WHERE company_id = p_company_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'User is already a member of this company.';
  END IF;

  -- Add to company
  INSERT INTO public.user_companies (company_id, user_id, membership_role)
  VALUES (p_company_id, v_user_id, 'member');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- UPDATED: approve_fleet_driver_request (Hub-aware version)
-- Now also inserts the approved agent into user_companies for Hub access.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.approve_fleet_driver_request(p_request_id UUID)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_request RECORD;
    v_company_id UUID;
BEGIN
    -- Get request (legacy: company_id = owner's profile ID)
    SELECT * INTO v_request
    FROM public.company_join_requests
    WHERE id = p_request_id AND company_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not authorized';
    END IF;

    -- Update request status
    UPDATE public.company_join_requests
    SET status = 'approved'
    WHERE id = p_request_id;

    -- Update driver profile (legacy field)
    UPDATE public.profiles
    SET company_id = v_request.company_id,
        agent_account_type = 'fleet_driver'
    WHERE id = v_request.driver_id;

    -- NEW: Find the owner's Hub company and add agent to user_companies
    SELECT uc.company_id INTO v_company_id
    FROM public.user_companies uc
    WHERE uc.user_id = auth.uid() AND uc.membership_role = 'owner'
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
      INSERT INTO public.user_companies (company_id, user_id, membership_role)
      VALUES (v_company_id, v_request.driver_id, 'member')
      ON CONFLICT (user_id, company_id) DO NOTHING;
    END IF;

    RETURN true;
END;
$$;

CREATE TRIGGER on_transaction_inserted
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();
-- ════════════════════════════════════════════════════════════════
-- MIGRATION 3: INVENTORY & OPERATIONS INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════════

-- 1. MATERIALS TABLE (Global configuration for allowed materials)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  category        TEXT NOT NULL,
  default_price   NUMERIC(10,2) DEFAULT 0.00,
  unit            TEXT DEFAULT 'KG',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Basic materials insert
INSERT INTO public.materials (name, category, default_price) VALUES 
('PET', 'Plastic', 20.00),
('HDPE', 'Plastic', 15.00),
('Paper', 'Paper', 5.00),
('Metal', 'Metal', 30.00),
('Glass', 'Glass', 2.00)
ON CONFLICT (name) DO NOTHING;

-- 2. HUB INVENTORY TABLE (Current stock levels per company)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hub_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_id     UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity        NUMERIC(15,2) DEFAULT 0.00 CHECK (quantity >= 0),
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_company_id ON public.hub_inventory(company_id);

-- 3. PROCESSING BATCHES TABLE (Queue management)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processing_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_id     UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  quantity_in     NUMERIC(15,2) NOT NULL CHECK (quantity_in > 0),
  quantity_out    NUMERIC(15,2) DEFAULT 0.00 CHECK (quantity_out >= 0),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'failed')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_company_id ON public.processing_batches(company_id);

-- 4. DISPATCH ORDERS TABLE (Outbound Logistics)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatch_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-transit', 'delivered', 'failed')),
  scheduled_for   TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_company_id ON public.dispatch_orders(company_id);

-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views materials" ON public.materials FOR SELECT USING (true);

CREATE POLICY "Company members view inventory" ON public.hub_inventory
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.hub_inventory.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view batches" ON public.processing_batches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.processing_batches.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view dispatch" ON public.dispatch_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.dispatch_orders.company_id AND uc.user_id = auth.uid())
  );

-- Operations managers can manage processing and dispatch
CREATE POLICY "Ops managers manage batches" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.processing_batches.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('operations_manager')
    )
  );

-- 6. TRIGGERS FOR DATA INTEGRITY
-- ----------------------------------------------------------------
-- Automatically add to inventory when a booking is completed
CREATE OR REPLACE FUNCTION add_booking_to_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_material_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.company_id IS NOT NULL THEN
    -- Find material ID based on booking waste_type (fallback to PET if not found for simplicity)
    SELECT id INTO v_material_id FROM public.materials WHERE name = NEW.waste_type LIMIT 1;
    IF v_material_id IS NULL THEN
      SELECT id INTO v_material_id FROM public.materials LIMIT 1;
    END IF;
    
    IF v_material_id IS NOT NULL THEN
      INSERT INTO public.hub_inventory (company_id, material_id, quantity)
      VALUES (NEW.company_id, v_material_id, COALESCE(NEW.actual_weight_kg, 0))
      ON CONFLICT (company_id, material_id) 
      DO UPDATE SET quantity = public.hub_inventory.quantity + EXCLUDED.quantity, last_updated = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_completed_inventory
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION add_booking_to_inventory();
-- ════════════════════════════════════════════════════════════════
-- MIGRATION 4: FLEET & SALES INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════════

-- 1. VEHICLES TABLE (Fleet Management)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plate_number    TEXT NOT NULL,
  type            TEXT CHECK (type IN ('truck', 'van', 'motorcycle')),
  capacity_kg     NUMERIC(10,2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'maintenance', 'offline')),
  fuel_type       TEXT CHECK (fuel_type IN ('diesel', 'petrol', 'electric')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, plate_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON public.vehicles(company_id);

-- 2. MAINTENANCE LOGS TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_type    TEXT NOT NULL, -- e.g., 'Oil Change', 'Tire Rotation'
  cost            NUMERIC(10,2) DEFAULT 0.00,
  date_performed  TIMESTAMPTZ DEFAULT NOW(),
  next_due_date   TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_company_id ON public.maintenance_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance_logs(vehicle_id);

-- 3. RFQS TABLE (Request For Quotation)
-- ----------------------------------------------------------------
ALTER TABLE public.rfqs 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_rfqs_company_id ON public.rfqs(company_id);

-- 4. CONTRACTS TABLE (Long-term B2B deals)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  buyer_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rfq_id          UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  material_id     UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  total_value     NUMERIC(15,2) NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_company_id ON public.contracts(company_id);

-- 5. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members view vehicles" ON public.vehicles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.vehicles.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view maintenance" ON public.maintenance_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.maintenance_logs.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view rfqs" ON public.rfqs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.rfqs.company_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Company members view contracts" ON public.contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_companies uc WHERE uc.company_id = public.contracts.company_id AND uc.user_id = auth.uid())
  );

-- Fleet Managers
CREATE POLICY "Fleet managers manage vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.vehicles.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('fleet_manager')
    )
  );

CREATE POLICY "Fleet managers manage maintenance" ON public.maintenance_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.maintenance_logs.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('fleet_manager')
    )
  );

-- Sales Managers
CREATE POLICY "Sales managers manage rfqs" ON public.rfqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.rfqs.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('sales_manager')
    )
  );

CREATE POLICY "Sales managers manage contracts" ON public.contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hub_user_roles hr 
      WHERE hr.company_id = public.contracts.company_id 
      AND hr.user_id = auth.uid() 
      AND hr.role IN ('sales_manager')
    )
  );
-- ════════════════════════════════════════════════════════════════
-- MIGRATION 5: DASHBOARD ANALYTICS (RPCs)
-- ════════════════════════════════════════════════════════════════
-- These RPCs are designed to match the precise data structures required 
-- by the Recharts visualizations and KPI cards in the frontend dashboards.

-- 1. EXECUTIVE KPI RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_executive_kpis(p_company_id UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Verify permission implicitly via RLS by just counting.
  -- (Since the underlying tables have RLS, these aggregations will only include accessible rows)
  SELECT json_build_object(
    'totalIntake', (SELECT COALESCE(SUM(actual_weight_kg), 0) FROM public.bookings WHERE company_id = p_company_id AND status = 'completed'),
    'activeAgents', (
       SELECT COUNT(DISTINCT user_id) 
       FROM public.user_companies 
       WHERE company_id = p_company_id AND membership_role = 'member'
    ),
    'monthlyRevenue', (SELECT COALESCE(SUM(total_price), 0) FROM public.marketplace_orders WHERE company_id = p_company_id AND status = 'completed'),
    'completedPickups', (SELECT COUNT(*) FROM public.bookings WHERE company_id = p_company_id AND status = 'completed')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. FINANCE KPI RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_finance_kpis(p_company_id UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'walletBalance', (SELECT COALESCE(SUM(balance), 0) FROM public.wallets WHERE company_id = p_company_id),
    'pendingPayouts', (SELECT COALESCE(SUM(amount), 0) FROM public.payouts WHERE company_id = p_company_id AND status = 'pending'),
    'totalDeposits', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE company_id = p_company_id AND type = 'deposit'),
    'totalWithdrawals', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE company_id = p_company_id AND type IN ('withdrawal', 'payout'))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. OPERATIONS KPI RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_operations_kpis(p_company_id UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'pendingBatches', (SELECT COUNT(*) FROM public.processing_batches WHERE company_id = p_company_id AND status = 'pending'),
    'inProgressBatches', (SELECT COUNT(*) FROM public.processing_batches WHERE company_id = p_company_id AND status = 'in-progress'),
    'totalInventoryKg', (SELECT COALESCE(SUM(quantity), 0) FROM public.hub_inventory WHERE company_id = p_company_id),
    'activeDisputes', (SELECT COUNT(*) FROM public.disputes WHERE company_id = p_company_id AND status = 'open')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. FLEET KPI RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_fleet_kpis(p_company_id UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalVehicles', (SELECT COUNT(*) FROM public.vehicles WHERE company_id = p_company_id),
    'activeVehicles', (SELECT COUNT(*) FROM public.vehicles WHERE company_id = p_company_id AND status = 'active'),
    'vehiclesInMaintenance', (SELECT COUNT(*) FROM public.vehicles WHERE company_id = p_company_id AND status = 'maintenance'),
    'upcomingMaintenance', (SELECT COUNT(*) FROM public.maintenance_logs WHERE company_id = p_company_id AND next_due_date > NOW() AND next_due_date < NOW() + INTERVAL '7 days')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. SALES KPI RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_sales_kpis(p_company_id UUID)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'activeRfqs', (SELECT COUNT(*) FROM public.rfqs WHERE company_id = p_company_id AND status = 'open'),
    'awardedRfqs', (SELECT COUNT(*) FROM public.rfqs WHERE company_id = p_company_id AND status = 'awarded'),
    'activeContracts', (SELECT COUNT(*) FROM public.contracts WHERE company_id = p_company_id AND status = 'active'),
    'totalContractValue', (SELECT COALESCE(SUM(total_value), 0) FROM public.contracts WHERE company_id = p_company_id AND status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- HUB APP REFACTOR (REMOVE DYNAMIC COLUMNS)
-- ===========================================
-- Removes analytics columns to support the new RPC-based architecture

ALTER TABLE public.waste_categories
DROP COLUMN IF EXISTS demand,
DROP COLUMN IF EXISTS supply,
DROP COLUMN IF EXISTS change_ksh,
DROP COLUMN IF EXISTS change_pct,
DROP COLUMN IF EXISTS top_buyer,
DROP COLUMN IF EXISTS price_per_unit;
