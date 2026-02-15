import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdminOrTeacher } from '../middleware/auth.js';
import { validate, noticeSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/notices - Get all notices
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const activeNotices = (data || [])
      .filter(notice => {
        if (!notice.expires_at) return true;
        return new Date(notice.expires_at) > now;
      })
      .map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        authorId: n.author_id,
        isPinned: n.is_pinned || false,
        targetRole: n.target_role,
        expiresAt: n.expires_at,
        createdAt: n.created_at
      }));

    res.json({
      success: true,
      data: activeNotices
    });
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notices',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/notices - Create notice (Admin/Teacher)
router.post('/', verifyToken, requireAdminOrTeacher, validate(noticeSchema), async (req, res) => {
  try {
    const { title, content, isPinned, targetRole, expiresAt } = req.body;

    const { data, error } = await supabase
      .from('notices')
      .insert({
        title,
        content,
        is_pinned: isPinned || false,
        target_role: targetRole || null,
        expires_at: expiresAt || null,
        author_id: req.user.userId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: {
        id: data.id,
        title: data.title,
        content: data.content,
        authorId: data.author_id,
        isPinned: data.is_pinned,
        targetRole: data.target_role,
        expiresAt: data.expires_at,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notice',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/notices/:id - Update notice (Admin/Teacher)
router.put('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isPinned, targetRole, expiresAt } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.is_pinned = isPinned;
    if (targetRole !== undefined) updateData.target_role = targetRole;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;

    const { data, error } = await supabase
      .from('notices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: {
        id: data.id,
        title: data.title,
        content: data.content,
        authorId: data.author_id,
        isPinned: data.is_pinned,
        targetRole: data.target_role,
        expiresAt: data.expires_at,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update notice',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/notices/:id - Delete notice (Admin/Teacher)
router.delete('/:id', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notice',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
