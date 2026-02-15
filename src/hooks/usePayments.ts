import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentRequest {
  id: number;
  userId: number | null;
  userName: string | null;
  courseId: number | null;
  amount: number | null;
  transactionId: string | null;
  senderName: string | null;
  screenshotUrl: string | null;
  status: string | null;
  createdAt: string | null;
}

export interface PaymentRequestInput {
  courseId: number;
  amount: number;
  transactionId: string;
  senderName: string;
  screenshotUrl?: string;
  userName?: string;
}

export const usePayments = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any[]>('/api/payment-requests');

      const formatted: PaymentRequest[] = (data || []).map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.userName,
        courseId: p.courseId,
        amount: p.amount,
        transactionId: p.transactionId,
        senderName: p.senderName,
        screenshotUrl: p.screenshotUrl,
        status: p.status,
        createdAt: p.createdAt,
      }));

      setPayments(formatted);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const createPaymentRequest = useCallback(async (input: PaymentRequestInput): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to submit payment");
      return false;
    }

    try {
      await apiPost('/api/payment-requests', input);

      toast.success("Payment request submitted!");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error creating payment request:", err);
      toast.error(err.message || "Failed to submit payment");
      return false;
    }
  }, [user, fetchPayments]);

  const approvePayment = useCallback(async (id: number): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return false;
    }

    try {
      await apiPatch(`/api/payment-requests/${id}`, { status: 'approved' });

      toast.success("Payment approved & user enrolled!");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error approving payment:", err);
      toast.error(err.message || "Failed to approve");
      return false;
    }
  }, [isAdmin, fetchPayments]);

  const rejectPayment = useCallback(async (id: number): Promise<boolean> => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return false;
    }

    try {
      await apiPatch(`/api/payment-requests/${id}`, { status: 'rejected' });

      toast.success("Payment rejected");
      await fetchPayments();
      return true;
    } catch (err: any) {
      console.error("Error rejecting payment:", err);
      toast.error(err.message || "Failed to reject");
      return false;
    }
  }, [isAdmin, fetchPayments]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  return {
    payments,
    loading,
    error,
    fetchPayments,
    createPaymentRequest,
    approvePayment,
    rejectPayment,
  };
};
