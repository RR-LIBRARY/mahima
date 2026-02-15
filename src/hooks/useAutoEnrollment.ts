import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoEnrollResult {
  success: boolean;
  enrolledCourseIds: number[];
  error?: string;
}

export const useAutoEnrollment = () => {
  /**
   * Auto-enrolls a user in all free courses (price = 0 or null)
   */
  const enrollInFreeCourses = useCallback(async (userId: string): Promise<AutoEnrollResult> => {
    try {
      // 1. Fetch all free courses
      const { data: freeCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, price')
        .or('price.eq.0,price.is.null');

      if (coursesError) throw coursesError;
      if (!freeCourses || freeCourses.length === 0) {
        return { success: true, enrolledCourseIds: [] };
      }

      // 2. Check existing enrollments to avoid duplicates
      const { data: existingEnrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId);

      if (enrollError) throw enrollError;

      const existingCourseIds = new Set((existingEnrollments || []).map(e => e.course_id));

      // 3. Filter out already enrolled courses
      const coursesToEnroll = freeCourses.filter(course => !existingCourseIds.has(course.id));

      if (coursesToEnroll.length === 0) {
        return { success: true, enrolledCourseIds: [] };
      }

      // 4. Create enrollment records for all free courses
      const enrollmentRecords = coursesToEnroll.map(course => ({
        user_id: userId,
        course_id: course.id,
        status: 'active',
      }));

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollmentRecords);

      if (insertError) throw insertError;

      console.log(`Auto-enrolled user ${userId} in ${coursesToEnroll.length} free courses`);

      return {
        success: true,
        enrolledCourseIds: coursesToEnroll.map(c => c.id),
      };
    } catch (error: any) {
      console.error("Auto-enrollment error:", error);
      return {
        success: false,
        enrolledCourseIds: [],
        error: error.message,
      };
    }
  }, []);

  /**
   * Get the first enrolled course for redirect
   */
  const getFirstEnrolledCourse = useCallback(async (userId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id, courses(id, title)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.course_id || null;
    } catch (error) {
      console.error("Error getting enrolled course:", error);
      return null;
    }
  }, []);

  /**
   * Check if user is enrolled in a specific course
   */
  const isEnrolledInCourse = useCallback(async (userId: string, courseId: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking enrollment:", error);
      return false;
    }
  }, []);

  return {
    enrollInFreeCourses,
    getFirstEnrolledCourse,
    isEnrolledInCourse,
  };
};
