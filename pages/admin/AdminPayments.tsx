
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
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Payments
        </h2>
        <div className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full">{payments.length} Submissions</div>
      </div>

      {loading ? (
        <div className="p-20 text-center"><Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {payments.map(p => (
            <div key={p.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 bg-black/20 border-white/5 transition-colors hover:bg-black/30">
              <div className="flex items-center gap-5 w-full md:w-auto">
                <button 
                  onClick={() => setViewingProof(p.proofUrl)}
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:border-primary transition-colors group flex-shrink-0"
                >
                  <Eye className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                    <span className="text-base font-bold text-white truncate">{p.username}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{p.plan}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {p.amount} • {p.method} • {new Date(p.date).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {p.status === PaymentStatus.PENDING ? (
                  <>
                    <button onClick={() => handleApprovePayment(p)} className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-all">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleRejectPayment(p.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-all">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                ) : (
                  <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    p.status === PaymentStatus.APPROVED ? 'bg-primary/5 text-primary' : 'bg-red-500/5 text-red-500'
                  }`}>
                    {p.status === PaymentStatus.APPROVED ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {p.status}
                  </div>
                )}
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="p-20 text-center glass rounded-2xl border-dashed border-white/5 opacity-50">
              <p className="text-xs font-semibold uppercase tracking-wider">No payment records found</p>
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
