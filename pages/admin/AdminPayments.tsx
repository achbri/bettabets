
import React, { useState, useEffect } from 'react';
import { CreditCard, Eye, X, Check, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PaymentRequest, PaymentStatus, SubscriptionType } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

const AdminPayments: React.FC = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    // Optimized: Fetching proofUrl separately only when needed is ideal, 
    // but for now we fetch it but keep list rows clean.
    const { data } = await supabase
      .from('payment_requests')
      .select('id, userId, username, plan, amount, method, status, date, proofUrl')
      .order('date', { ascending: false });
    
    if (data) setPayments(data as PaymentRequest[]);
    setLoading(false);
  };

  const handleApprovePayment = async (payment: PaymentRequest) => {
    try {
      const { error: payError } = await supabase
        .from('payment_requests')
        .update({ status: PaymentStatus.APPROVED })
        .eq('id', payment.id);
      
      if (payError) throw payError;

      const planType = payment.plan.includes('VVIP') ? SubscriptionType.VVIP : SubscriptionType.VIP;
      let days = 30;
      if (payment.plan.includes('1 Week')) days = 7;
      if (payment.plan.includes('2 Weeks')) days = 14;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);

      const { error: userError } = await supabase
        .from('profiles')
        .update({ 
          subscription: planType, 
          expiry_date: expiry.toISOString() 
        })
        .eq('id', payment.userId);
      
      if (!userError) {
        showToast(`Plan activated for ${payment.username}`, "success");
        fetchPayments();
      } else {
        throw userError;
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRejectPayment = async (id: string) => {
    if (!confirm("Reject this payment?")) return;
    const { error } = await supabase
      .from('payment_requests')
      .update({ status: PaymentStatus.REJECTED })
      .eq('id', id);
    
    if (!error) {
      showToast("Payment rejected", "info");
      fetchPayments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Payments</h2>
        <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{payments.length} Submissions</div>
      </div>

      {loading ? (
        <div className="p-20 text-center"><Loader2 className="w-12 h-12 text-[#00C853] animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map(p => (
            <div key={p.id} className="glass p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-black/40 border-white/5 transition-all hover:border-white/10">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setViewingProof(p.proofUrl)}
                  className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:border-[#00C853] transition-colors group"
                >
                  <Eye className="w-6 h-6 text-gray-500 group-hover:text-[#00C853]" />
                </button>
                <div>
                  <div className="font-black italic uppercase text-xl mb-1">{p.username}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex flex-wrap gap-3 items-center">
                    <span className="text-[#00C853] bg-[#00C853]/5 px-2 py-0.5 rounded border border-[#00C853]/10">{p.plan}</span>
                    <span className="text-white font-bold">{p.amount}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{p.method}</span>
                    <span className="opacity-40">{new Date(p.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {p.status === PaymentStatus.PENDING ? (
                  <>
                    <button onClick={() => handleApprovePayment(p)} className="bg-[#00C853] text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#00C853]/20 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleRejectPayment(p.id)} className="bg-red-500/10 text-red-500 px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic hover:bg-red-500/20 transition-all flex items-center gap-2">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                ) : (
                  <div className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase italic flex items-center gap-2 border ${
                    p.status === PaymentStatus.APPROVED ? 'bg-[#00C853]/5 border-[#00C853]/20 text-[#00C853]' : 'bg-red-500/5 border-red-500/20 text-red-500'
                  }`}>
                    {p.status === PaymentStatus.APPROVED ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {p.status}
                  </div>
                )}
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-32 text-center glass rounded-[4rem] border-dashed border-white/5 opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">No payment records found</p>
            </div>
          )}
        </div>
      )}

      {/* Proof Viewer Overlay */}
      {viewingProof && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <button onClick={() => setViewingProof(null)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
            <X className="w-8 h-8" />
          </button>
          <img src={viewingProof} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" alt="Payment Proof" />
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
