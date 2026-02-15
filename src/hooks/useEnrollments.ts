import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Course } from "./useCourses";

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  purchasedAt: string | null;
  status: string | null;
}

export interface EnrollmentWithCourse extends Enrollment {
  course?: Course;
}

export const useEnrollments = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!user) {
      setEnrollments([]);
      setEnrolledCourseIds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any[]>('/api/enrollments');

      const formattedEnrollments: EnrollmentWithCourse[] = (data || []).map((e: any) => ({
        id: e.id,
        userId: e.userId,
        courseId: e.courseId,
        purchasedAt: e.purchasedAt,
        status: e.status,
      }));

      setEnrollments(formattedEnrollments);
      setEnrolledCourseIds(formattedEnrollments.filter(e => e.status === 'active').map((e) => e.courseId));
    } catch (err: any) {
      console.error("Error fetching enrollments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isEnrolled = useCallback((courseId: number): boolean => {
    return enrolledCourseIds.includes(courseId);
  }, [enrolledCourseIds]);

  const checkEnrollment = useCallback(async (courseId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const data = await apiGet<any>(`/api/enrollments/${courseId}`);
      return !!data && data.status === 'active';
    } catch (err: any) {
      console.error("Error checking enrollment:", err);
      return false;
    }
  }, [user]);

  const enrollInCourse = useCallback(async (courseId: number): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to enroll");
      return false;
    }

    try {
      const alreadyEnrolled = await checkEnrollment(courseId);
      if (alreadyEnrolled) {
        toast.info("You are already enrolled in this course");
        return true;
      }

      await apiPost('/api/enrollments', {
        courseId,
        status: 'active',
      });

      toast.success("Successfully enrolled in course!");
      await fetchEnrollments();
      return true;
    } catch (err: any) {
      console.error("Error enrolling in course:", err);
      toast.error(err.message || "Failed to enroll");
      return false;
    }
  }, [user, checkEnrollment, fetchEnrollments]);

  const cancelEnrollment = useCallback(async (enrollmentId: number): Promise<boolean> => {
    try {
      toast.success("Enrollment cancelled");
      await fetchEnrollments();
      return true;
    } catch (err: any) {
      console.error("Error cancelling enrollment:", err);
      toast.error(err.message || "Failed to cancel enrollment");
      return false;
    }
  }, [fetchEnrollments]);

  const getEnrolledCourses = useCallback((): Course[] => {
    return enrollments
      .filter((e) => e.course)
      .map((e) => e.course!);
  }, [enrollments]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return {
    enrollments,
    enrolledCourseIds,
    loading,
    error,
    fetchEnrollments,
    isEnrolled,
    checkEnrollment,
    enrollInCourse,
    cancelEnrollment,
    getEnrolledCourses,
  };
};
