import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Comment {
  id: string;
  lessonId: string | null;
  userName: string;
  message: string;
  createdAt: string | null;
}

export interface CommentInput {
  lessonId: string;
  message: string;
}

/**
 * useComments Hook - Uses Supabase directly for comments
 * 
 * Fixed from /api/comments endpoints (which caused 405/406 errors)
 * to use direct Supabase queries with proper RLS policies.
 */
export const useComments = (lessonId?: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!lessonId) {
        setComments([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("comments")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching comments:", fetchError);
        setError(fetchError.message);
        setComments([]);
        return;
      }

      const formatted: Comment[] = (data || []).map((c) => ({
        id: c.id,
        lessonId: c.lesson_id,
        userName: c.user_name,
        message: c.message,
        createdAt: c.created_at,
      }));

      setComments(formatted);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const createComment = useCallback(async (input: CommentInput, userName: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to comment");
      return false;
    }

    try {
      const { error: insertError } = await supabase
        .from("comments")
        .insert({
          lesson_id: input.lessonId,
          user_name: userName,
          message: input.message,
        });

      if (insertError) {
        console.error("Error creating comment:", insertError);
        toast.error(insertError.message || "Failed to post comment");
        return false;
      }

      toast.success("Comment posted!");
      await fetchComments();
      return true;
    } catch (err: any) {
      console.error("Error creating comment:", err);
      toast.error(err.message || "Failed to post comment");
      return false;
    }
  }, [user, fetchComments]);

  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please login to delete comments");
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (deleteError) {
        console.error("Error deleting comment:", deleteError);
        toast.error(deleteError.message || "Failed to delete comment");
        return false;
      }

      toast.success("Comment deleted");
      await fetchComments();
      return true;
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      toast.error(err.message || "Failed to delete comment");
      return false;
    }
  }, [user, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    deleteComment,
  };
};
