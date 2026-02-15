import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StorageBucket = 'course-videos' | 'course-materials' | 'receipts' | 'avatars' | 'content';

export interface UploadResult {
  publicUrl: string;
  path: string;
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (
    bucket: StorageBucket,
    file: File,
    folder: string = ''
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress(0);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setProgress(80);

      // For public buckets, get public URL; for private, create signed URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      setProgress(100);
      toast.success("File uploaded successfully");
      return { publicUrl, path: filePath };
    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast.error(err.message || "Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (
    bucket: StorageBucket,
    path: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      toast.success("File deleted");
      return true;
    } catch (err: any) {
      console.error("Error deleting file:", err);
      toast.error(err.message || "Failed to delete file");
      return false;
    }
  }, []);

  const getSignedUrl = useCallback(async (
    bucket: StorageBucket,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);
      if (error) throw error;
      return data.signedUrl;
    } catch (err: any) {
      console.error("Error creating signed URL:", err);
      return null;
    }
  }, []);

  const listFiles = useCallback(async (
    bucket: StorageBucket,
    folder: string = ''
  ) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folder);
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error("Error listing files:", err);
      return [];
    }
  }, []);

  return {
    uploading,
    progress,
    uploadFile,
    deleteFile,
    getSignedUrl,
    listFiles,
  };
};
