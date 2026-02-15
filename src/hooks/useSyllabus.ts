import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Syllabus {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  weekNumber: number | null;
  topics: string[] | null;
  createdAt: string;
}

export interface SyllabusInput {
  courseId: number;
  title: string;
  description?: string;
  weekNumber?: number;
  topics?: string[];
}

export const useSyllabus = (courseId?: number) => {
  const { isAdmin, isTeacher } = useAuth();
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!courseId) {
        setSyllabus([]);
        setLoading(false);
        return;
      }

      const data = await apiGet<any[]>(`/api/courses/${courseId}/syllabus`);

      const formatted: Syllabus[] = (data || []).map((s) => ({
        id: s.id,
        courseId: s.courseId,
        title: s.title,
        description: s.description,
        weekNumber: s.weekNumber,
        topics: s.topics,
        createdAt: s.createdAt,
      }));

      setSyllabus(formatted);
    } catch (err: any) {
      console.error("Error fetching syllabus:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const createSyllabus = useCallback(async (input: SyllabusInput): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      await apiPost('/api/syllabus', input);

      toast.success("Syllabus added!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error creating syllabus:", err);
      toast.error(err.message || "Failed to add syllabus");
      return false;
    }
  }, [isAdmin, isTeacher, fetchSyllabus]);

  const updateSyllabus = useCallback(async (id: number, input: Partial<SyllabusInput>): Promise<boolean> => {
    try {
      await apiPatch(`/api/syllabus/${id}`, input);

      toast.success("Syllabus updated!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error updating syllabus:", err);
      toast.error(err.message || "Failed to update");
      return false;
    }
  }, [fetchSyllabus]);

  const deleteSyllabus = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiDelete(`/api/syllabus/${id}`);

      toast.success("Syllabus deleted!");
      await fetchSyllabus();
      return true;
    } catch (err: any) {
      console.error("Error deleting syllabus:", err);
      toast.error(err.message || "Failed to delete");
      return false;
    }
  }, [fetchSyllabus]);

  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  return {
    syllabus,
    loading,
    error,
    fetchSyllabus,
    createSyllabus,
    updateSyllabus,
    deleteSyllabus,
  };
};
