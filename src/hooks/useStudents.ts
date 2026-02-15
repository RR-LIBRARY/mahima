import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Student {
  id: number;
  name: string;
  rollNumber: string;
  grade: number;
  section: string;
  createdAt: string;
}

export interface StudentInput {
  name: string;
  rollNumber: string;
  grade: number;
  section: string;
}

export const useStudents = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiGet<any[]>('/api/students');

      const formatted: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        grade: s.grade,
        section: s.section,
        createdAt: s.createdAt,
      }));

      setStudents(formatted);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentsByGrade = useCallback(async (grade: number): Promise<Student[]> => {
    try {
      const data = await apiGet<any[]>('/api/students');
      return (data || [])
        .filter(s => s.grade === grade)
        .map((s) => ({
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          grade: s.grade,
          section: s.section,
          createdAt: s.createdAt,
        }));
    } catch (err: any) {
      console.error("Error fetching students by grade:", err);
      return [];
    }
  }, []);

  const createStudent = useCallback(async (input: StudentInput): Promise<boolean> => {
    if (!isAdmin && !isTeacher) {
      toast.error("Permission denied");
      return false;
    }

    try {
      await apiPost('/api/students', input);

      toast.success("Student added successfully!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error creating student:", err);
      toast.error(err.message || "Failed to add student");
      return false;
    }
  }, [isAdmin, isTeacher, fetchStudents]);

  const updateStudent = useCallback(async (id: number, input: Partial<StudentInput>): Promise<boolean> => {
    try {
      await apiPatch(`/api/students/${id}`, input);

      toast.success("Student updated!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error updating student:", err);
      toast.error(err.message || "Failed to update");
      return false;
    }
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiDelete(`/api/students/${id}`);

      toast.success("Student deleted!");
      await fetchStudents();
      return true;
    } catch (err: any) {
      console.error("Error deleting student:", err);
      toast.error(err.message || "Failed to delete");
      return false;
    }
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    fetchStudents,
    fetchStudentsByGrade,
    createStudent,
    updateStudent,
    deleteStudent,
  };
};
