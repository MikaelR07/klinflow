import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Shield, ShieldCheck, Mail, 
  Trash2, Loader2, Check, X, Search, Settings,
  ChevronRight, Phone, MapPin, Calendar, Star,
  Activity, CreditCard, TrendingUp, Crown, UserCheck
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membership_role: string;
  roles: string[];
}

const ALL_HUB_ROLES = [
  { id: 'operations_manager', label: 'Operations Manager', desc: 'Manage batches, intake, and inventory', color: 'emerald' },
  { id: 'fleet_manager', label: 'Fleet Manager', desc: 'Manage vehicles, agents, and maintenance', color: 'blue' },
  { id: 'sales_manager', label: 'Sales Manager', desc: 'Manage RFQs, contracts, and marketplace', color: 'violet' },
  { id: 'finance_manager', label: 'Finance Manager', desc: 'Manage wallets, payouts, and ledger', color: 'amber' },
  { id: 'executive_viewer', label: 'Executive Viewer', desc: 'Read-only access to all dashboards', color: 'slate' }
];

const getRoleBadgeColor = (role: string) => {
  if (role.includes('operations')) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (role.includes('fleet')) return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
  if (role.includes('sales')) return 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400';
  if (role.includes('finance')) return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
  if (role.includes('executive')) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  return 'bg-slate-100 text-slate-600';
};

const getRoleLabel = (role: string) => {
  const found = ALL_HUB_ROLES.find(r => r.id === role);
  return found ? found.label : role;
};

export default function TeamManagement() {
  const { currentCompanyId, membershipRole } = useAuthStore() as any;
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sliding sidebar
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isUpdatingRoles, setIsUpdatingRoles] = useState(false);
  const [selectedMemberSettingsAccess, setSelectedMemberSettingsAccess] = useState<boolean | null>(null);
  const [isUpdatingSettingsAccess, setIsUpdatingSettingsAccess] = useState(false);

  useEffect(() => {
    if (selectedMember && selectedMember.membership_role !== 'owner' && currentCompanyId) {
      const checkSettingsAccess = async () => {
        try {
          const { data, error } = await supabase
            .from('hub_user_permissions')
            .select('*')
            .eq('user_id', selectedMember.id)
            .eq('company_id', currentCompanyId)
            .eq('permission', 'setting:update')
            .eq('granted', true)
            .maybeSingle();
          if (error) throw error;
          setSelectedMemberSettingsAccess(!!data);
        } catch (err) {
          console.error("Error checking settings access", err);
          setSelectedMemberSettingsAccess(false);
        }
      };
      checkSettingsAccess();
    } else {
      setSelectedMemberSettingsAccess(null);
    }
  }, [selectedMember, currentCompanyId]);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const isOwner = membershipRole === 'owner';

  const fetchTeam = async () => {
    if (!currentCompanyId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('rpc_get_company_team' as any, { p_company_id: currentCompanyId });
      if (error) throw error;
      setTeam((data as TeamMember[]) || []);
    } catch (err: any) {
      toast.error('Failed to load team', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, [currentCompanyId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !currentCompanyId) return;
    setIsInviting(true);
    try {
      const { error } = await supabase.rpc('rpc_hub_invite_member' as any, { 
        p_company_id: currentCompanyId, p_email: inviteEmail 
      });
      if (error) throw error;
      toast.success('Member Added!', { description: `${inviteEmail} is now part of the team.` });
      setShowInviteModal(false);
      setInviteEmail('');
      fetchTeam();
    } catch (err: any) {
      toast.error('Invite Failed', { description: err.message });
    } finally {
      setIsInviting(false);
    }
  };

  const toggleRole = async (roleId: string) => {
    if (!selectedMember || !currentCompanyId) return;
    setIsUpdatingRoles(true);
    try {
      const hasRole = selectedMember.roles.includes(roleId);
      if (hasRole) {
        const { error } = await supabase
          .from('hub_user_roles').delete()
          .eq('company_id', currentCompanyId)
          .eq('user_id', selectedMember.id)
          .eq('role', roleId);
        if (error) throw error;
        setSelectedMember(prev => prev ? { ...prev, roles: prev.roles.filter(r => r !== roleId) } : prev);
      } else {
        const { error } = await supabase
          .from('hub_user_roles')
          .insert({ company_id: currentCompanyId, user_id: selectedMember.id, role: roleId } as any);
        if (error) throw error;
        setSelectedMember(prev => prev ? { ...prev, roles: [...prev.roles, roleId] } : prev);
      }
      setTeam(prev => prev.map(m => {
        if (m.id === selectedMember.id) {
          const newRoles = hasRole ? m.roles.filter(r => r !== roleId) : [...m.roles, roleId];
          return { ...m, roles: newRoles };
        }
        return m;
      }));
      toast.success(hasRole ? 'Role Removed' : 'Role Assigned');
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsUpdatingRoles(false);
    }
  };

  const toggleSettingsAccess = async () => {
    if (!selectedMember || !currentCompanyId) return;
    setIsUpdatingSettingsAccess(true);
    const hasAccess = selectedMemberSettingsAccess;
    try {
      if (hasAccess) {
        const { error } = await supabase
          .from('hub_user_permissions')
          .delete()
          .eq('user_id', selectedMember.id)
          .eq('company_id', currentCompanyId)
          .eq('permission', 'setting:update');
        if (error) throw error;
        setSelectedMemberSettingsAccess(false);
        toast.success('Settings Access Revoked', { description: 'User can no longer edit Hub Settings.' });
      } else {
        const { error } = await supabase
          .from('hub_user_permissions')
          .upsert({
            user_id: selectedMember.id,
            company_id: currentCompanyId,
            permission: 'setting:update',
            granted: true
          }, { onConflict: 'user_id,company_id,permission,granted' });
        if (error) throw error;
        setSelectedMemberSettingsAccess(true);
        toast.success('Settings Access Granted', { description: 'User can now edit Hub Settings.' });
      }
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsUpdatingSettingsAccess(false);
    }
  };

  const removeMember = async () => {
    if (!currentCompanyId || !selectedMember) return;
    if (!window.confirm(`Remove ${selectedMember.name} from the company? They will lose all Hub access.`)) return;
    try {
      const { error } = await supabase
        .from('user_companies').delete()
        .eq('company_id', currentCompanyId)
        .eq('user_id', selectedMember.id);
      if (error) throw error;
      toast.success('Member Removed', { description: `${selectedMember.name} has been revoked.` });
      setSelectedMember(null);
      fetchTeam();
    } catch (err: any) {
      toast.error('Remove Failed', { description: err.message });
    }
  };

  const filteredTeam = team.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery)
  );

  const ownerCount = team.filter(t => t.membership_role === 'owner').length;
  const memberCount = team.filter(t => t.membership_role === 'member').length;
  const roledCount = team.filter(t => t.roles.length > 0 && t.membership_role !== 'owner').length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Team & Access Control</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Manage personnel, assign Hub roles, and control access to your organization.</p>
          </div>
          {isOwner && (
            <div className="flex gap-3">
              <button 
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Invite Member
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Members', value: team.length, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10', trend: 'Active personnel' },
            { icon: Crown, label: 'Owners', value: ownerCount, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10', trend: 'Full access' },
            { icon: UserCheck, label: 'Members', value: memberCount, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', trend: 'Team members' },
            { icon: ShieldCheck, label: 'With Roles', value: roledCount, color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10', trend: 'Have Hub roles' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="font-bold text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">{kpi.label}</p>
              </div>
              <h3 className="text-2xl font-black text-[#131722] dark:text-white tracking-tight">{kpi.value}</h3>
              <p className="text-[10px] font-bold mt-1.5 text-emerald-500">{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-96 pl-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-transparent text-sm outline-none text-[#131722] dark:text-white placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Team Directory Table */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 w-64">Personnel</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Hub Roles</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Contact</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></td></tr>
                ) : filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="font-bold text-base text-[#131722] dark:text-white">No members found</p>
                      <p className="text-sm text-slate-500 mt-1">Invite team members to get started.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map(member => (
                    <tr 
                      key={member.id} 
                      onClick={() => setSelectedMember(member)}
                      className="hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                            member.membership_role === 'owner' 
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 border-2 border-amber-200 dark:border-amber-500/30' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20'
                          }`}>
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              member.name?.charAt(0)?.toUpperCase() || '?'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#131722] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {member.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{member.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                          member.membership_role === 'owner' 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}>
                          {member.membership_role === 'owner' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {member.membership_role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.membership_role === 'owner' ? (
                          <span className="text-[10px] font-bold text-slate-400 italic">Full System Access</span>
                        ) : member.roles.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400 italic">No Roles</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {member.roles.map(role => (
                              <span key={role} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeColor(role)}`}>
                                {role.replace('_manager', '').replace('_viewer', '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{member.phone || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVER PANEL ── */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* @ts-ignore */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            />
            {/* @ts-ignore */}
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
                <div className="flex items-start justify-between w-full mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-2xl font-black shadow-inner ${
                      selectedMember.membership_role === 'owner'
                        ? 'bg-amber-100 border-2 border-amber-200 dark:border-amber-500/30 dark:bg-amber-500/20 text-amber-600'
                        : 'bg-emerald-100 border border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/20 text-emerald-600'
                    }`}>
                      {selectedMember.avatar ? (
                        <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedMember.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#131722] dark:text-white">{selectedMember.name}</h2>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
                          selectedMember.membership_role === 'owner' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {selectedMember.membership_role === 'owner' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {selectedMember.membership_role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMember(null)} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar space-y-8">
                
                {/* Contact & Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                    <Activity className="w-4 h-4" /> Contact & Identity
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Phone className="w-4 h-4 text-slate-500" /></div>
                      <div><p className="text-[10px] font-bold text-slate-500">Phone</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedMember.phone || 'Not provided'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Mail className="w-4 h-4 text-slate-500" /></div>
                      <div><p className="text-[10px] font-bold text-slate-500">Email</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedMember.email || 'Not provided'}</p></div>
                    </div>
                  </div>
                </div>

                {/* Hub Roles Section */}
                {isOwner && selectedMember.membership_role !== 'owner' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                      <Settings className="w-4 h-4" /> Hub Role Assignment
                    </div>
                    <div className="space-y-2">
                      {ALL_HUB_ROLES.map(role => {
                        const isActive = selectedMember.roles.includes(role.id);
                        return (
                          <button
                            key={role.id}
                            disabled={isUpdatingRoles}
                            onClick={() => toggleRole(role.id)}
                            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left ${
                              isActive 
                                ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' 
                                : 'bg-white dark:bg-slate-800 border-[#e0e3eb] dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-500/30'
                            }`}
                          >
                            <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              isActive ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isActive && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#131722] dark:text-white'}`}>{role.label}</p>
                              <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">{role.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                      
                      {/* Custom Settings Permission */}
                      <div className="pt-2 mt-2 border-t border-[#e0e3eb] dark:border-slate-700/50">
                        <button
                          disabled={isUpdatingSettingsAccess || selectedMemberSettingsAccess === null}
                          onClick={toggleSettingsAccess}
                          className={`w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left ${
                            selectedMemberSettingsAccess
                              ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                              : 'bg-white dark:bg-slate-800 border-[#e0e3eb] dark:border-slate-700/50 hover:border-amber-300 dark:hover:border-amber-500/30'
                          }`}
                        >
                          <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selectedMemberSettingsAccess ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedMemberSettingsAccess && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${selectedMemberSettingsAccess ? 'text-amber-700 dark:text-amber-400' : 'text-[#131722] dark:text-white'}`}>Hub Settings Manager</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate">Allow editing of prices and facility config</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner notice */}
                {selectedMember.membership_role === 'owner' && (
                  <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Crown className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Company Owner</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-1 font-medium">This user has full administrative access to all Hub features and cannot be removed or have roles modified.</p>
                    </div>
                  </div>
                )}

                {/* Current Roles Summary */}
                {selectedMember.roles.length > 0 && selectedMember.membership_role !== 'owner' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                      <ShieldCheck className="w-4 h-4" /> Active Permissions
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedMember.roles.map(role => (
                        <div key={role} className={`p-3 rounded-xl ${getRoleBadgeColor(role)} flex items-center gap-2`}>
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{getRoleLabel(role).replace(' Manager', '').replace(' Viewer', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              {isOwner && selectedMember.membership_role !== 'owner' && (
                <div className="p-5 border-t border-[#e0e3eb] dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <button 
                    onClick={removeMember}
                    className="w-full py-3 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Remove from Company
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── INVITE MODAL ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
            <div className="p-6 sm:p-8">
               <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                 <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
               </div>
               <h2 className="text-xl font-bold text-[#131722] dark:text-white mb-2">Invite Team Member</h2>
               <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                 Enter the email of a registered Klinflow user. They will be instantly added to your organization.
               </p>
               <form onSubmit={handleInvite} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     <input 
                       type="email" required autoFocus
                       placeholder="member@company.com"
                       value={inviteEmail}
                       onChange={(e) => setInviteEmail(e.target.value)}
                       className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                     />
                   </div>
                 </div>
                 <div className="flex items-center gap-3 pt-4">
                   <button type="button" onClick={() => setShowInviteModal(false)}
                     className="flex-1 py-3.5 rounded-2xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors uppercase tracking-widest">
                     Cancel
                   </button>
                   <button type="submit" disabled={isInviting || !inviteEmail}
                     className="flex-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm shadow-emerald-500/20">
                     {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
                   </button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
