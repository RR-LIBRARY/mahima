import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';
import { validate, lessonSchema, lessonUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/lessons - Get all lessons
router.get('/', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    
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

    const { data, error } = await query;

    if (error) throw error;

    const lessons = (data || []).map(l => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      description: l.description,
      videoUrl: l.video_url,
      isLocked: l.is_locked,
      createdAt: l.created_at,
      course: l.courses ? {
        title: l.courses.title,
        grade: l.courses.grade
      } : undefined
    }));

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Fetch lessons error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lessons',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/lessons/:id - Get lesson by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        courses:course_id (title, grade)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lesson not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        videoUrl: data.video_url,
        isLocked: data.is_locked,
        createdAt: data.created_at,
        course: data.courses ? {
          title: data.courses.title,
          grade: data.courses.grade
        } : undefined
      }
    });
  } catch (error) {
    console.error('Fetch lesson error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lesson',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/courses/:courseId/lessons - Get lessons by course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const lessons = (data || []).map(l => ({
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      description: l.description,
      videoUrl: l.video_url,
      isLocked: l.is_locked,
      createdAt: l.created_at
    }));

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Fetch lessons error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lessons',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/lessons - Create lesson (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, validate(lessonSchema), async (req, res) => {
  try {
    const { courseId, title, description, videoUrl, isLocked } = req.body;

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        description: description || null,
        video_url: videoUrl,
        is_locked: isLocked ?? true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        videoUrl: data.video_url,
        isLocked: data.is_locked,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create lesson',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/lessons/:id - Update lesson (Admin/Teacher)
router.put('/:id', verifyToken, requireAdminOrTeacher, validate(lessonUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId, title, description, videoUrl, isLocked } = req.body;

    const updateData = {};
    if (courseId !== undefined) updateData.course_id = courseId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (videoUrl !== undefined) updateData.video_url = videoUrl;
    if (isLocked !== undefined) updateData.is_locked = isLocked;

    const { data, error } = await supabase
      .from('lessons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: {
        id: data.id,
        courseId: data.course_id,
        title: data.title,
        description: data.description,
        videoUrl: data.video_url,
        isLocked: data.is_locked,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update lesson',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/lessons/:id - Delete lesson (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete lesson',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
