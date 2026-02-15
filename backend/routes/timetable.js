import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';
import { validate, timetableSchema, timetableUpdateSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/timetable - Get timetable
router.get('/', async (req, res) => {
  try {
    const { dayOfWeek } = req.query;

    let query = supabase
      .from('timetable')
      .select(`
        *,
        courses:course_id (title, grade)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (dayOfWeek !== undefined) {
      query = query.eq('day_of_week', parseInt(dayOfWeek));
    }

    const { data, error } = await query;

    if (error) throw error;

    const timetable = (data || []).map(t => ({
      id: t.id,
      courseId: t.course_id,
      dayOfWeek: t.day_of_week,
      startTime: t.start_time,
      endTime: t.end_time,
      room: t.room,
      teacherId: t.teacher_id,
      createdAt: t.created_at,
      course: t.courses ? {
        title: t.courses.title,
        grade: t.courses.grade
      } : undefined
    }));

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Fetch timetable error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch timetable',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/timetable/today - Get today's schedule
router.get('/today', async (req, res) => {
  try {
    const today = new Date().getDay();

    const { data, error } = await supabase
      .from('timetable')
      .select(`
        *,
        courses:course_id (title, grade)
      `)
      .eq('day_of_week', today)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const timetable = (data || []).map(t => ({
      id: t.id,
      courseId: t.course_id,
      dayOfWeek: t.day_of_week,
      startTime: t.start_time,
      endTime: t.end_time,
      room: t.room,
      teacherId: t.teacher_id,
      createdAt: t.created_at,
      course: t.courses ? {
        title: t.courses.title,
        grade: t.courses.grade
      } : undefined
    }));

    res.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Fetch today schedule error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch today schedule',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/timetable - Create entry (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, validate(timetableSchema), async (req, res) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, room, teacherId } = req.body;

    const { data, error } = await supabase
      .from('timetable')
      .insert({
        course_id: courseId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room: room || null,
        teacher_id: teacherId || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Schedule entry added',
      data: {
        id: data.id,
        courseId: data.course_id,
        dayOfWeek: data.day_of_week,
        startTime: data.start_time,
        endTime: data.end_time,
        room: data.room,
        teacherId: data.teacher_id,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create entry',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/timetable/:id - Update entry (Admin/Teacher)
router.put('/:id', verifyToken, requireAdminOrTeacher, validate(timetableUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId, dayOfWeek, startTime, endTime, room, teacherId } = req.body;

    const updateData = {};
    if (courseId !== undefined) updateData.course_id = courseId;
    if (dayOfWeek !== undefined) updateData.day_of_week = dayOfWeek;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (room !== undefined) updateData.room = room;
    if (teacherId !== undefined) updateData.teacher_id = teacherId;

    const { data, error } = await supabase
      .from('timetable')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Schedule updated',
      data: {
        id: data.id,
        courseId: data.course_id,
        dayOfWeek: data.day_of_week,
        startTime: data.start_time,
        endTime: data.end_time,
        room: data.room,
        teacherId: data.teacher_id,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update entry',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/timetable/:id - Delete entry (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Schedule entry removed'
    });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete entry',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
