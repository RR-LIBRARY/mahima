import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken } from '../middleware/auth.js';
import { validate, messageSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/messages/inbox - Get inbox messages
router.get('/inbox', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const messages = (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      subject: m.subject,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at
    }));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Fetch inbox error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/messages/sent - Get sent messages
router.get('/sent', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', req.user.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const messages = (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      subject: m.subject,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at
    }));

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Fetch sent error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages',
      code: 'FETCH_FAILED'
    });
  }
});

// GET /api/messages/unread-count - Get unread count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', req.user.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      count: count || 0
    });
  } catch (error) {
    console.error('Fetch unread count error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unread count',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/messages - Send message
router.post('/', verifyToken, validate(messageSchema), async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.userId,
        recipient_id: recipientId,
        subject,
        content,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: data.id,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        subject: data.subject,
        content: data.content,
        isRead: data.is_read,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message',
      code: 'SEND_FAILED'
    });
  }
});

// PUT /api/messages/:id/read - Mark as read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark message as read',
      code: 'UPDATE_FAILED'
    });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .eq('sender_id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete message',
      code: 'DELETE_FAILED'
    });
  }
});

export default router;
