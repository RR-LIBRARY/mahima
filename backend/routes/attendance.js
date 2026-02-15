import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';

const router = express.Router();

// GET /api/attendance - Get attendance records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { studentId, date, startDate, endDate } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        students:student_id (name, roll_number, grade, section)
      `)
      .order('date', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', parseInt(studentId));
    }
    if (date) {
      query = query.eq('date', date);
    }
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const attendance = (data || []).map(a => ({
      id: a.id,
      studentId: a.student_id,
      date: a.date,
      status: a.status,
      createdAt: a.created_at,
      student: a.students ? {
        name: a.students.name,
        rollNumber: a.students.roll_number,
        grade: a.students.grade,
        section: a.students.section
      } : undefined
    }));

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch attendance',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/attendance - Mark attendance (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    // Check if attendance already exists for this student on this date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Attendance updated',
        data: {
          id: data.id,
          studentId: data.student_id,
          date: data.date,
          status: data.status,
          createdAt: data.created_at
        }
      });
    }

    // Create new record
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        student_id: studentId,
        date,
        status
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Attendance marked',
      data: {
        id: data.id,
        studentId: data.student_id,
        date: data.date,
        status: data.status,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark attendance',
      code: 'CREATE_FAILED'
    });
  }
});

// POST /api/attendance/bulk - Bulk mark attendance (Admin/Teacher)
router.post('/bulk', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { records } = req.body; // Array of { studentId, date, status }

    const results = [];
    for (const record of records) {
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', record.studentId)
        .eq('date', record.date)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('attendance')
          .update({ status: record.status })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('attendance')
          .insert({
            student_id: record.studentId,
            date: record.date,
            status: record.status
          });
      }
      results.push({ studentId: record.studentId, success: true });
    }

    res.json({
      success: true,
      message: 'Bulk attendance updated',
      results
    });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update attendance',
      code: 'BULK_FAILED'
    });
  }
});

// DELETE /api/attendance/:id - Delete attendance record (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Attendance record deleted'
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete attendance',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
