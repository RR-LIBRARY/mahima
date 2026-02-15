import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { toast } from "sonner";

export interface Course {
  id: number;
  title: string;
  description: string | null;
  grade: string | null;
  price: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string | null;
}

export interface CourseInput {
  title: string;
  description?: string;
  grade?: string;
  price?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiGet<any[]>('/api/courses');

      const formattedCourses: Course[] = (data || []).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        grade: c.grade,
        price: c.price,
        imageUrl: c.imageUrl,
        thumbnailUrl: c.thumbnailUrl,
        createdAt: c.createdAt,
      }));

      setCourses(formattedCourses);
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseById = useCallback(async (id: number): Promise<Course | null> => {
    try {
      const data = await apiGet<any>(`/api/courses/${id}`);
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        price: data.price,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        createdAt: data.createdAt,
      };
    } catch (err: any) {
      console.error("Error fetching course:", err);
      toast.error("Failed to fetch course");
      return null;
    }
  }, []);

  const fetchCoursesByGrade = useCallback(async (grade: string): Promise<Course[]> => {
    try {
      const data = await apiGet<any[]>('/api/courses');
      return (data || [])
        .filter(c => c.grade === grade)
        .map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          grade: c.grade,
          price: c.price,
          imageUrl: c.imageUrl,
          thumbnailUrl: c.thumbnailUrl,
          createdAt: c.createdAt,
        }));
    } catch (err: any) {
      console.error("Error fetching courses by grade:", err);
      return [];
    }
  }, []);

  const createCourse = useCallback(async (input: CourseInput): Promise<Course | null> => {
    try {
      const data = await apiPost<any>('/api/courses', {
        title: input.title,
        description: input.description || null,
        grade: input.grade || null,
        price: input.price || 0,
        imageUrl: input.imageUrl || "https://placehold.co/600x400/png?text=Course",
        thumbnailUrl: input.thumbnailUrl || null,
      });

      toast.success("Course created successfully!");
      await fetchCourses();

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        price: data.price,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        createdAt: data.createdAt,
      };
    } catch (err: any) {
      console.error("Error creating course:", err);
      toast.error(err.message || "Failed to create course");
      return null;
    }
  }, [fetchCourses]);

  const updateCourse = useCallback(async (id: number, input: Partial<CourseInput>): Promise<boolean> => {
    try {
      await apiPatch(`/api/courses/${id}`, input);

      toast.success("Course updated successfully!");
      await fetchCourses();
      return true;
    } catch (err: any) {
      console.error("Error updating course:", err);
      toast.error(err.message || "Failed to update course");
      return false;
    }
  }, [fetchCourses]);

  const deleteCourse = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiDelete(`/api/courses/${id}`);

      toast.success("Course deleted successfully!");
      await fetchCourses();
      return true;
    } catch (err: any) {
      console.error("Error deleting course:", err);
      toast.error(err.message || "Failed to delete course");
      return false;
    }
  }, [fetchCourses]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    fetchCourseById,
    fetchCoursesByGrade,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
