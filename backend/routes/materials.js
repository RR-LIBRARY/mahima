import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';
import { validate, materialSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/materials - Get all materials
router.get('/', verifyToken, async (req, res) => {
  try {
    const { courseId, lessonId } = req.query;
    
    let query = supabase
      .from('materials')
      .select(`
        *,
        courses:course_id (title, grade)
      `)
      .order('created_at', { ascending: false });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    if (lessonId) {
      query = query.eq('lesson_id', lessonId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const materials = (data || []).map(m => ({
      id: m.id,
      courseId: m.course_id,
      lessonId: m.lesson_id,
      title: m.title,
      description: m.description,
      fileUrl: m.file_url,
      fileType: m.file_type,
      fileSize: m.file_size,
      uploadedBy: m.uploaded_by,
      createdAt: m.created_at,
      course: m.courses ? {
        title: m.courses.title,
        grade: m.courses.grade
      } : undefined
    }));

    res.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error('Fetch materials error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch materials',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/materials/:id - Get material by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        courses:course_id (title, grade)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Material not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        title: data.title,
        description: data.description,
        fileUrl: data.file_url,
        fileType: data.file_type,
        fileSize: data.file_size,
        uploadedBy: data.uploaded_by,
        createdAt: data.created_at,
        course: data.courses ? {
          title: data.courses.title,
          grade: data.courses.grade
        } : undefined
      }
    });
  } catch (error) {
    console.error('Fetch material error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch material',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/materials - Create material (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, validate(materialSchema), async (req, res) => {
  try {
    const { courseId, lessonId, title, description, fileUrl, fileType, fileSize } = req.body;

    const { data, error } = await supabase
      .from('materials')
      .insert({
        course_id: courseId || null,
        lesson_id: lessonId || null,
        title,
        description: description || null,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize || null,
        uploaded_by: req.user.userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: {
        id: data.id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        title: data.title,
        description: data.description,
        fileUrl: data.file_url,
        fileType: data.file_type,
        fileSize: data.file_size,
        uploadedBy: data.uploaded_by,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create material',
      code: 'CREATE_FAILED'
    });
  }
});

// DELETE /api/materials/:id - Delete material (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete material',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
