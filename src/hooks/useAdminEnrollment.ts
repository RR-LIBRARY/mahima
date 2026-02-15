import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminEnrollmentResult {
  success: boolean;
  alreadyEnrolled?: boolean;
  data?: {
    id: number;
    courseId: number;
  };
  error?: string;
}

export const useAdminEnrollment = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const adminEnroll = async (courseId: number): Promise<AdminEnrollmentResult> => {
    if (!user) {
      toast.error('Please login first');
      return { success: false, error: 'Not authenticated' };
    }

    if (!isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    setIsEnrolling(true);

    try {
      // Server-side admin verification using RPC function
      const { data: roleData, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError) {
        console.error('Role check error:', roleError);
        throw new Error('Failed to verify admin role');
      }

      if (!roleData) {
        throw new Error('Admin access required - server verification failed');
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'active')
        .maybeSingle();

      if (existingEnrollment) {
        toast.info('You are already enrolled in this course');
        navigate(`/classes/${courseId}/lessons`);
        return {
          success: true,
          alreadyEnrolled: true,
          data: { id: existingEnrollment.id, courseId },
        };
      }

      // Create enrollment directly (RLS policy "Admins can manage enrollments" allows this)
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active'
        })
        .select()
        .single();

      if (enrollError) {
        console.error('Admin enrollment error:', enrollError);
        throw new Error('Failed to create enrollment');
      }

      console.log(`[ADMIN BYPASS] User ${user.id} enrolled in course ${courseId} - Admin Override`);

      toast.success('🎉 Admin Access Granted!', {
        description: 'You now have full access to this course.',
      });

      // Navigate to course lessons
      navigate(`/classes/${courseId}/lessons`);

      return {
        success: true,
        alreadyEnrolled: false,
        data: { id: enrollment.id, courseId },
      };
    } catch (error: any) {
      console.error('Admin enrollment error:', error);
      toast.error(error.message || 'Failed to enroll');
      return { success: false, error: error.message };
    } finally {
      setIsEnrolling(false);
    }
  };

  return {
    adminEnroll,
    isAdmin,
    isEnrolling,
  };
};
