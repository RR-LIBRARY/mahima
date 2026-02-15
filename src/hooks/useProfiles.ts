import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: number;
  fullName: string | null;
  email: string | null;
  mobile: string | null;
  role: string | null;
  createdAt: string | null;
}

export interface ProfileInput {
  fullName?: string;
  email?: string;
  mobile?: string;
}

export const useProfiles = () => {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any>('/api/profile');

      if (data) {
        setProfile({
          id: data.id,
          fullName: data.fullName,
          email: data.email,
          mobile: data.mobile,
          role: data.role,
          createdAt: null,
        });
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAllProfiles = useCallback(async (): Promise<Profile[]> => {
    if (!isAdmin) return [];

    try {
      const data = await apiGet<any[]>('/api/users');

      const formatted: Profile[] = (data || []).map((p: any) => ({
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        mobile: p.mobile,
        role: p.role,
        createdAt: null,
      }));

      setProfiles(formatted);
      return formatted;
    } catch (err: any) {
      console.error("Error fetching all profiles:", err);
      return [];
    }
  }, [isAdmin]);

  const updateProfile = useCallback(async (input: ProfileInput): Promise<boolean> => {
    if (!user) {
      toast.error("Please login");
      return false;
    }

    try {
      await apiPatch('/api/profile', input);

      toast.success("Profile updated!");
      await fetchProfile();
      return true;
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error(err.message || "Failed to update");
      return false;
    }
  }, [user, fetchProfile]);

  const createProfile = useCallback(async (userId: number, fullName: string): Promise<boolean> => {
    return true;
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    profiles,
    loading,
    error,
    fetchProfile,
    fetchAllProfiles,
    updateProfile,
    createProfile,
  };
};
