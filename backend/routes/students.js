import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';

const router = express.Router();

// GET /api/students - Get all students
router.get('/', verifyToken, async (req, res) => {
  try {
    const { grade, section } = req.query;

    let query = supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;

    if (error) throw error;

    const students = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      rollNumber: s.roll_number,
      grade: s.grade,
      section: s.section,
      createdAt: s.created_at
    }));

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch students',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        rollNumber: data.roll_number,
        grade: data.grade,
        section: data.section,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Fetch student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch student',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/students - Create student (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { name, rollNumber, grade, section } = req.body;

    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        roll_number: rollNumber,
        grade,
        section
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: {
        id: data.id,
        name: data.name,
        rollNumber: data.roll_number,
        grade: data.grade,
        section: data.section,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add student',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/students/:id - Update student (Admin/Teacher)
router.put('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rollNumber, grade, section } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rollNumber !== undefined) updateData.roll_number = rollNumber;
    if (grade !== undefined) updateData.grade = grade;
    if (section !== undefined) updateData.section = section;

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: {
        id: data.id,
        name: data.name,
        rollNumber: data.roll_number,
        grade: data.grade,
        section: data.section,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update student',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/students/:id - Delete student (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete student',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
