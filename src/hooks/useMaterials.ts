import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Material {
  id: number;
  courseId: number | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  uploadedBy: number | null;
  createdAt: string;
}

export interface MaterialWithCourse extends Material {
  course?: {
    title: string;
    grade: string | null;
  };
}

export interface MaterialInput {
  courseId?: number;
  lessonId?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  file?: File;
}

export const useMaterials = (courseId?: number) => {
  const { user, isAdmin, isTeacher } = useAuth();
  const [materials, setMaterials] = useState<MaterialWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = courseId ? `?courseId=${courseId}` : '';
      const data = await apiGet<any[]>(`/api/materials${params}`);

      const formattedMaterials: MaterialWithCourse[] = (data || []).map((m: any) => ({
        id: m.id,
        courseId: m.courseId,
        lessonId: m.lessonId,
        title: m.title,
        description: m.description,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        fileSize: m.fileSize,
        uploadedBy: m.uploadedBy,
        createdAt: m.createdAt,
      }));

      setMaterials(formattedMaterials);
    } catch (err: any) {
      console.error("Error fetching materials:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const uploadMaterial = useCallback(async (input: MaterialInput): Promise<boolean> => {
    if (!user || (!isAdmin && !isTeacher)) {
      toast.error("You don't have permission to upload materials");
      return false;
    }

    try {
      setUploading(true);

      await apiPost('/api/materials', input);

      toast.success("Material uploaded successfully!");
      await fetchMaterials();
      return true;
    } catch (err: any) {
      console.error("Error uploading material:", err);
      toast.error(err.message || "Failed to upload material");
      return false;
    } finally {
      setUploading(false);
    }
  }, [user, isAdmin, isTeacher, fetchMaterials]);

  const deleteMaterial = useCallback(async (id: number): Promise<boolean> => {
    try {
      await apiDelete(`/api/materials/${id}`);

      toast.success("Material deleted!");
      await fetchMaterials();
      return true;
    } catch (err: any) {
      console.error("Error deleting material:", err);
      toast.error(err.message || "Failed to delete material");
      return false;
    }
  }, [fetchMaterials]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return {
    materials,
    loading,
    uploading,
    error,
    fetchMaterials,
    uploadMaterial,
    deleteMaterial,
  };
};
