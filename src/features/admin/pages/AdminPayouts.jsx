import React, { useState, useEffect } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import AdminLayout from '../components/AdminLayout';
import { YummyText } from '../../../components/YummyText';
import { getPayoutRequests, approvePayout, rejectPayout, processPayout } from '../../../utils/adminApi';
import { Check, X, Send, Loader2 } from 'lucide-react';

const formatCurrency = (val) => {
  if (val == null) return '₦0.00';
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const AdminPayouts = () => {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [processModal, setProcessModal] = useState({ open: false, id: null, paymentReference: '', paymentMethod: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getPayoutRequests(pagination.page, pagination.limit, statusFilter);
      const data = res?.data?.data ?? res?.data ?? {};
      setRequests(Array.isArray(data.payoutRequests) ? data.payoutRequests : []);
      if (data.pagination) setPagination((p) => ({ ...p, ...data.pagination }));
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Failed to load payouts', type: 'danger' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, pagination.limit, statusFilter]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await approvePayout(id);
      setToast({ show: true, message: 'Payout approved', type: 'success' });
      fetchRequests();
    } catch (err) {
      setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Approve failed', type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    const { id, reason } = rejectModal;
    if (!id) return;
    try {
      setActionLoading(id);
      await rejectPayout(id, reason);
      setToast({ show: true, message: 'Payout rejected', type: 'success' });
      setRejectModal({ open: false, id: null, reason: '' });
      fetchRequests();
    } catch (err) {
      setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Reject failed', type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async () => {
    const { id, paymentReference, paymentMethod } = processModal;
    if (!id) return;
    try {
      setActionLoading(id);
      await processPayout(id, paymentReference, paymentMethod);
      setToast({ show: true, message: 'Payout processed', type: 'success' });
      setProcessModal({ open: false, id: null, paymentReference: '', paymentMethod: '' });
      fetchRequests();
    } catch (err) {
      setToast({ show: true, message: err?.response?.data?.message || err?.message || 'Process failed', type: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const driverBank = (driver) => {
    if (!driver) return null;
    const { bankCode, bankAccountNumber, bankAccountName } = driver;
    if (!bankAccountNumber) return <span className="text-amber-600 text-sm">No bank details</span>;
    return (
      <div className="text-sm text-[#64748B] mt-1">
        <div>Bank: {bankCode || '—'} · Account: {bankAccountNumber} · {bankAccountName || '—'}</div>
      </div>
    );
  };

  return (
    <IonPage>
      <AdminLayout>
        <IonContent className="ion-padding">
          <YummyText>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-[#0F172A]">Payout Requests</h1>
                <p className="text-sm text-[#64748B]">Approve, reject, or process rider withdrawals. Driver bank details are shown for transfer.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#64748B]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none text-sm"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00D68F]" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-[#64748B]">
                No payout requests found.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const driver = req.driver || {};
                  const id = req._id || req.id;
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  return (
                    <div key={id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <div className="font-medium text-[#0F172A]">{driver.fullName || '—'}</div>
                          <div className="text-sm text-[#64748B]">{driver.email}</div>
                          {driverBank(driver)}
                          <div className="mt-2 text-lg font-semibold text-[#00B75A]">{formatCurrency(req.amount)}</div>
                          <div className="text-xs text-[#64748B]">
                            Requested: {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'} · Status: <span className="font-medium capitalize">{req.status}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(id)}
                                disabled={actionLoading === id}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#00B75A] text-white text-sm font-medium hover:bg-[#00A63E] disabled:opacity-50"
                              >
                                {actionLoading === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, id, reason: '' })}
                                disabled={actionLoading === id}
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" /> Reject
                              </button>
                            </>
                          )}
                          {isApproved && (
                            <button
                              onClick={() => setProcessModal({ open: true, id, paymentReference: '', paymentMethod: 'bank_transfer' })}
                              disabled={actionLoading === id}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] disabled:opacity-50"
                            >
                              {actionLoading === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              Mark Processed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reject modal */}
            {rejectModal.open && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Reject Payout</h3>
                  <p className="text-sm text-[#64748B] mb-3">Optionally provide a reason (shown to rider).</p>
                  <textarea
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
                    placeholder="Reason (optional)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none text-sm mb-4"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setRejectModal({ open: false, id: null, reason: '' })} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-[#0F172A]">Cancel</button>
                    <button onClick={handleReject} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              </div>
            )}

            {/* Process modal */}
            {processModal.open && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-semibold text-[#0F172A] mb-2">Mark as Processed</h3>
                  <p className="text-sm text-[#64748B] mb-3">After transferring to the rider&apos;s bank, record the payment reference.</p>
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={processModal.paymentReference}
                      onChange={(e) => setProcessModal((m) => ({ ...m, paymentReference: e.target.value }))}
                      placeholder="Payment / transaction reference"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={processModal.paymentMethod}
                      onChange={(e) => setProcessModal((m) => ({ ...m, paymentMethod: e.target.value }))}
                      placeholder="Payment method (e.g. bank_transfer)"
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#00D68F] focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setProcessModal({ open: false, id: null, paymentReference: '', paymentMethod: '' })} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-[#0F172A]">Cancel</button>
                    <button onClick={handleProcess} disabled={actionLoading} className="flex-1 px-4 py-2 bg-[#00B75A] text-white rounded-xl hover:bg-[#00A63E] disabled:opacity-50">Confirm</button>
                  </div>
                </div>
              </div>
            )}

            {toast.show && (
              <div className={`fixed bottom-4 left-4 right-4 max-w-md mx-auto px-4 py-3 rounded-xl text-white text-center text-sm ${toast.type === 'success' ? 'bg-[#00B75A]' : 'bg-red-600'}`}>
                {toast.message}
                <button onClick={() => setToast((t) => ({ ...t, show: false }))} className="ml-2 underline">Dismiss</button>
              </div>
            )}
          </YummyText>
        </IonContent>
      </AdminLayout>
    </IonPage>
  );
};

export default AdminPayouts;
