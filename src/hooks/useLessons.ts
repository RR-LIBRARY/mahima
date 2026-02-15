import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Lesson {
  id: string;
  courseId: number | null;
  title: string;
  description: string | null;
  videoUrl: string;
  isLocked: boolean;
  duration: number;
  createdAt: string | null;
}

export interface LessonWithCourse extends Lesson {
  course?: {
    title: string;
    grade: string | null;
  };
}

export interface LessonInput {
  courseId: number;
  title: string;
  description?: string;
  videoUrl: string;
  isLocked?: boolean;
  duration?: number;
}

/**
 * Hook to manage lessons with direct Supabase integration
 * Provides CRUD operations for lessons with proper error handling
 */
export const useLessons = (courseId?: number) => {
  const { user, isAdmin, isTeacher } = useAuth();
  const [lessons, setLessons] = useState<LessonWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('lessons')
        .select(`
          *,
          courses:course_id (title, grade)
        `)
        .order('created_at', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedLessons: LessonWithCourse[] = (data || []).map((l: any) => ({
        id: l.id,
        courseId: l.course_id,
        title: l.title,
        description: l.description,
        videoUrl: l.video_url,
        isLocked: l.is_locked ?? true,
        duration: l.duration ?? 0,
        createdAt: l.created_at,
        course: l.courses ? {
          title: l.courses.title,
          grade: l.courses.grade
        } : undefined
      }));

      setLessons(formattedLessons);
    } catch (err: any) {
      console.error("Error fetching lessons:", err);
      setError(err.message);
      toast.error("Failed to fetch lessons");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchLessonById = useCallback(async (id: string): Promise<LessonWithCourse | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('lessons')
        .select(`
          *,
          courses:course_id (title, grade)
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) return null;

      return {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        videoUrl: data.video_url,
        isLocked: data.is_locked ?? true,
        duration: data.duration ?? 0,
        createdAt: data.created_at,
        course: data.courses ? {
          title: data.courses.title,
          grade: data.courses.grade
        } : undefined
      };
    } catch (err: any) {
      console.error("Error fetching lesson:", err);
      toast.error("Failed to fetch lesson");
      return null;
    }
  }, []);

  const createLesson = useCallback(async (input: LessonInput): Promise<Lesson | null> => {
    if (!user || (!isAdmin && !isTeacher)) {
      toast.error("You don't have permission to create lessons");
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('lessons')
        .insert({
          course_id: input.courseId,
          title: input.title,
          description: input.description || null,
          video_url: input.videoUrl,
          is_locked: input.isLocked ?? true,
          duration: input.duration ?? 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Lesson created successfully!");
      await fetchLessons();

      return {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        videoUrl: data.video_url,
        isLocked: data.is_locked ?? true,
        duration: data.duration ?? 0,
        createdAt: data.created_at,
      };
    } catch (err: any) {
      console.error("Error creating lesson:", err);
      toast.error(err.message || "Failed to create lesson");
      return null;
    }
  }, [user, isAdmin, isTeacher, fetchLessons]);

  const updateLesson = useCallback(async (id: string, input: Partial<LessonInput>): Promise<boolean> => {
    if (!user || (!isAdmin && !isTeacher)) {
      toast.error("You don't have permission to update lessons");
      return false;
    }

    try {
      const updateData: any = {};
      if (input.courseId !== undefined) updateData.course_id = input.courseId;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.videoUrl !== undefined) updateData.video_url = input.videoUrl;
      if (input.isLocked !== undefined) updateData.is_locked = input.isLocked;
      if (input.duration !== undefined) updateData.duration = input.duration;

      const { error: updateError } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success("Lesson updated successfully!");
      await fetchLessons();
      return true;
    } catch (err: any) {
      console.error("Error updating lesson:", err);
      toast.error(err.message || "Failed to update lesson");
      return false;
    }
  }, [user, isAdmin, isTeacher, fetchLessons]);

  const deleteLesson = useCallback(async (id: string): Promise<boolean> => {
    if (!user || (!isAdmin && !isTeacher)) {
      toast.error("You don't have permission to delete lessons");
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success("Lesson deleted successfully!");
      await fetchLessons();
      return true;
    } catch (err: any) {
      console.error("Error deleting lesson:", err);
      toast.error(err.message || "Failed to delete lesson");
      return false;
    }
  }, [user, isAdmin, isTeacher, fetchLessons]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  return {
    lessons,
    loading,
    error,
    fetchLessons,
    fetchLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
  };
};
