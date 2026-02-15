import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { toast } from "sonner";

export interface Lead {
  id: number;
  parentName: string;
  email: string;
  grade: string;
  createdAt: string | null;
}

export interface LeadInput {
  parentName: string;
  email: string;
  grade: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any[]>('/api/leads');

      const formatted: Lead[] = (data || []).map((l: any) => ({
        id: l.id,
        parentName: l.parentName,
        email: l.email,
        grade: l.grade,
        createdAt: l.createdAt,
      }));

      setLeads(formatted);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitLead = useCallback(async (input: LeadInput): Promise<boolean> => {
    try {
      await apiPost('/api/leads', {
        parentName: input.parentName,
        email: input.email,
        grade: input.grade,
      });

      toast.success("Thank you! We'll contact you soon.");
      return true;
    } catch (err: any) {
      console.error("Error submitting lead:", err);
      toast.error(err.message || "Failed to submit");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    submitLead,
  };
};
