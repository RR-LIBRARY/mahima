import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TimetableEntry {
  id: number;
  courseId: number | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  teacherId: number | null;
  createdAt: string;
}

export interface TimetableEntryWithCourse extends TimetableEntry {
  course?: {
    title: string;
    grade: string | null;
  };
}

export interface TimetableInput {
  courseId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  teacherId?: number;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useTimetable = () => {
  const { user, isAdmin, isTeacher } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntryWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any[]>('/api/timetable');

      const formattedTimetable: TimetableEntryWithCourse[] = (data || []).map((t: any) => ({
        id: t.id,
        courseId: t.courseId,
        dayOfWeek: t.dayOfWeek,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room,
        teacherId: t.teacherId,
        createdAt: t.createdAt,
      }));

      setTimetable(formattedTimetable);
    } catch (err: any) {
      console.error("Error fetching timetable:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTimetableByDay = useCallback((dayOfWeek: number): TimetableEntryWithCourse[] => {
    return timetable.filter(entry => entry.dayOfWeek === dayOfWeek);
  }, [timetable]);

  const getTodaySchedule = useCallback((): TimetableEntryWithCourse[] => {
    const today = new Date().getDay();
    return getTimetableByDay(today);
  }, [getTimetableByDay]);

  const createEntry = useCallback(async (input: TimetableInput): Promise<boolean> => {
    if (!user || (!isAdmin && !isTeacher)) {
      toast.error("You don't have permission to modify timetable");
      return false;
    }

    try {
      await apiPost('/api/timetable', input);

      toast.success("Schedule entry added!");
      await fetchTimetable();
      return true;
    } catch (err: any) {
      console.error("Error creating timetable entry:", err);
      toast.error(err.message || "Failed to add entry");
      return false;
    }
  }, [user, isAdmin, isTeacher, fetchTimetable]);

  const updateEntry = useCallback(async (id: number, input: Partial<TimetableInput>): Promise<boolean> => {
    try {
      await apiPatch(`/api/timetable/${id}`, input);

      toast.success("Schedule updated!");
      await fetchTimetable();
      return true;
    } catch (err: any) {
      console.error("Error updating timetable entry:", err);
      toast.error(err.message || "Failed to update entry");
      return false;
    }
  }, [fetchTimetable]);

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiDelete(`/api/timetable/${id}`);

      toast.success("Schedule entry removed!");
      await fetchTimetable();
      return true;
    } catch (err: any) {
      console.error("Error deleting timetable entry:", err);
      toast.error(err.message || "Failed to delete entry");
      return false;
    }
  }, [fetchTimetable]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  return {
    timetable,
    loading,
    error,
    fetchTimetable,
    getTimetableByDay,
    getTodaySchedule,
    createEntry,
    updateEntry,
    deleteEntry,
    DAY_NAMES,
  };
};
