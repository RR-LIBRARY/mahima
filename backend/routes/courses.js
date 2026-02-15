import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { validate, courseSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
  try {
    const { grade } = req.query;
    
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query;

    if (error) throw error;

    const courses = (data || []).map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      grade: c.grade,
      price: c.price,
      imageUrl: c.image_url,
      thumbnailUrl: c.thumbnail_url,
      createdAt: c.created_at
    }));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch courses',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/courses/:id - Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        price: data.price,
        imageUrl: data.image_url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Fetch course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch course',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/courses - Create course (Admin only)
router.post('/', verifyToken, requireAdmin, validate(courseSchema), async (req, res) => {
  try {
    const { title, description, grade, price, imageUrl, thumbnailUrl } = req.body;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        description: description || null,
        grade: grade || null,
        price: price || 0,
        image_url: imageUrl || 'https://placehold.co/600x400/png?text=Course',
        thumbnail_url: thumbnailUrl || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        price: data.price,
        imageUrl: data.image_url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create course',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/courses/:id - Update course (Admin only)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, grade, price, imageUrl, thumbnailUrl } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (grade !== undefined) updateData.grade = grade;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (thumbnailUrl !== undefined) updateData.thumbnail_url = thumbnailUrl;

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        grade: data.grade,
        price: data.price,
        imageUrl: data.image_url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update course',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/courses/:id - Delete course (Admin only)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete course',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
