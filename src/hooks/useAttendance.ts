import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Attendance {
  id: number;
  studentId: number;
  date: string;
  status: string;
  createdAt: string;
}

export interface AttendanceInput {
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export const useAttendance = (date?: string) => {
  const { isAdmin, isTeacher } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      const url = `/api/attendance${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await apiGet<any[]>(url);

      const formatted: Attendance[] = (data || []).map((a) => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date,
        status: a.status,
        createdAt: a.createdAt,
      }));

      setAttendance(formatted);
    } catch (err: any) {
      console.error("Error fetching attendance:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const fetchAttendanceByStudent = useCallback(async (studentId: number): Promise<Attendance[]> => {
    try {
      const data = await apiGet<any[]>(`/api/attendance?studentId=${studentId}`);

      return (data || []).map((a) => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date,
        status: a.status,
        createdAt: a.createdAt,
      }));
    } catch (err: any) {
      console.error("Error fetching student attendance:", err);
      return [];
    }
  }, []);

  const markAttendance = useCallback(async (input: AttendanceInput): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      await apiPost('/api/attendance', input);

      toast.success("Attendance marked!");
      await fetchAttendance();
      return true;
    } catch (err: any) {
      console.error("Error marking attendance:", err);
      toast.error(err.message || "Failed to mark attendance");
      return false;
    }
  }, [isAdmin, isTeacher, fetchAttendance]);

  const bulkMarkAttendance = useCallback(async (records: AttendanceInput[]): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      for (const record of records) {
        await markAttendance(record);
      }
      toast.success("Bulk attendance saved!");
      return true;
    } catch (err: any) {
      console.error("Error in bulk attendance:", err);
      toast.error("Failed to save some records");
      return false;
    }
  }, [isAdmin, isTeacher, markAttendance]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    attendance,
    loading,
    error,
    fetchAttendance,
    fetchAttendanceByStudent,
    markAttendance,
    bulkMarkAttendance,
  };
};
