
import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Ban, User as UserIcon, Loader2 } from 'lucide-react';
import { User, UserRole, SubscriptionType } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, role, subscription, expiry_date, country, is_blocked')
      .order('username');
    
    if (error) {
      showToast("Error fetching users: " + error.message, "error");
    } else if (data) {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  const handleUpdateRole = async (id: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) { 
      showToast("User role updated successfully", "success"); 
      fetchUsers(); 
    } else {
      showToast("Role update failed: " + error.message, "error");
    }
  };

  const handleUpdateSub = async (id: string, sub: SubscriptionType) => {
    try {
      setLoading(true);
      // Explicitly handle date logic for consistency
      const now = new Date();
      const expiry = sub === SubscriptionType.FREE 
        ? null 
        : new Date(now.setDate(now.getDate() + 30)).toISOString();

      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription: sub, 
          expiry_date: expiry 
        })
        .eq('id', id);

      if (error) throw error;

      showToast(`Account updated to ${sub} tier`, "success"); 
      await fetchUsers(); // Re-fetch to confirm UI sync
    } catch (err: any) {
      showToast("Subscription update failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (u: User) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
    if (!error) { 
      showToast(`User ${!u.is_blocked ? 'Blocked' : 'Unblocked'}`, u.is_blocked ? "info" : "warning"); 
      fetchUsers(); 
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Directory</h2>
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{users.length} Registered Nodes</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-slate-100 dark:bg-white/5 border border-white/10 pl-11 pr-6 py-4 rounded-2xl outline-none focus:border-[#00C853]/50 text-xs font-bold w-64 transition-all focus:w-80" 
          />
        </div>
      </div>

      <div className="glass rounded-[3rem] overflow-hidden bg-white dark:bg-black/40 shadow-xl border-white/5">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            <tr>
              <th className="px-10 py-6">Identity</th>
              <th className="px-10 py-6">Subscription Tier</th>
              <th className="px-10 py-6">Access Role</th>
              <th className="px-10 py-6 text-right">Security</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-10 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00C853] mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Decrypting User Data...</p>
                </td>
              </tr>
            ) : filteredUsers.map(u => (
              <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors ${u.is_blocked ? 'opacity-40' : ''}`}>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-white/10">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-black italic uppercase text-sm tracking-tight">{u.username}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <select 
                    value={u.subscription} 
                    onChange={(e) => handleUpdateSub(u.id, e.target.value as SubscriptionType)} 
                    className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#00C853] outline-none hover:border-[#00C853]/50 transition-colors"
                  >
                    <option value={SubscriptionType.FREE}>FREE</option>
                    <option value={SubscriptionType.VIP}>VIP</option>
                    <option value={SubscriptionType.VVIP}>VVIP</option>
                  </select>
                </td>
                <td className="px-10 py-8">
                  <select 
                    value={u.role} 
                    onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)} 
                    className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none hover:border-white/20 transition-colors"
                  >
                    <option value={UserRole.USER}>Member</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </td>
                <td className="px-10 py-8 text-right">
                  <button 
                    onClick={() => handleToggleBlock(u)} 
                    className={`p-3 rounded-2xl transition-all ${u.is_blocked ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'} hover:scale-110`}
                    title={u.is_blocked ? "Unblock User" : "Block User"}
                  >
                    {u.is_blocked ? <ShieldCheck className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
