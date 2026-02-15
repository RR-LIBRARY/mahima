import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { validate, enrollmentSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/enrollments - Get user's enrollments
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses:course_id (id, title, description, grade, price, image_url, thumbnail_url)
      `)
      .eq('user_id', req.user.userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;

    const enrollments = (data || []).map(e => ({
      id: e.id,
      userId: e.user_id,
      courseId: e.course_id,
      status: e.status,
      purchasedAt: e.purchased_at,
      course: e.courses ? {
        id: e.courses.id,
        title: e.courses.title,
        description: e.courses.description,
        grade: e.courses.grade,
        price: e.courses.price,
        imageUrl: e.courses.image_url,
        thumbnailUrl: e.courses.thumbnail_url
      } : undefined
    }));

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Fetch enrollments error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enrollments',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/enrollments/:courseId - Check enrollment status
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', req.user.userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      enrolled: !!data,
      data: data ? {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        status: data.status,
        purchasedAt: data.purchased_at
      } : null
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check enrollment',
      code: 'CHECK_FAILED'
    });
  }
});

// POST /api/enrollments - Enroll in course
router.post('/', verifyToken, validate(enrollmentSchema), async (req, res) => {
  try {
    const { courseId } = req.body;

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'Already enrolled in this course',
        code: 'ALREADY_ENROLLED'
      });
    }

    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: req.user.userId,
        course_id: courseId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        status: data.status,
        purchasedAt: data.purchased_at
      }
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to enroll',
      code: 'ENROLL_FAILED'
    });
  }
});

// POST /api/enrollments/admin-bypass - Admin instant enrollment (server-side validated)
router.post('/admin-bypass', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.userId;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required',
        code: 'MISSING_COURSE_ID'
      });
    }

    // CRITICAL: Server-side admin role verification from DATABASE
    // Never trust frontend isAdmin flag
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Role check error:', roleError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify admin role',
        code: 'ROLE_CHECK_FAILED'
      });
    }

    if (!roleData) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'FORBIDDEN'
      });
    }

    // Verify course exists
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND'
      });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Already enrolled in this course',
        alreadyEnrolled: true,
        data: { id: existing.id }
      });
    }

    // Create enrollment with admin bypass
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active'
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Admin enrollment error:', enrollError);
      throw enrollError;
    }

    console.log(`[ADMIN BYPASS] User ${userId} enrolled in course ${courseId} (₹${courseData.price}) - Admin Override`);

    res.status(201).json({
      success: true,
      message: 'Admin Access Granted',
      data: {
        id: enrollment.id,
        userId: enrollment.user_id,
        courseId: enrollment.course_id,
        status: enrollment.status,
        purchasedAt: enrollment.purchased_at,
        adminOverride: true
      }
    });
  } catch (error) {
    console.error('Admin bypass error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process admin enrollment',
      code: 'ADMIN_BYPASS_FAILED'
    });
  }
});

// DELETE /api/enrollments/:id - Cancel enrollment (Admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Enrollment cancelled'
    });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel enrollment',
      code: 'CANCEL_FAILED'
    });
  }
});

export default router;
