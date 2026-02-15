import express from 'express';
import { supabase } from '../config/supabase.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { validate, paymentSchema } from '../middleware/validation.js';

const router = express.Router();

// GET /api/payments - Get payment requests
router.get('/', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    let query = supabase
      .from('payment_requests')
      .select(`
        *,
        courses:course_id (title, price)
      `)
      .order('created_at', { ascending: false });

    // Non-admins can only see their own requests
    if (!isAdmin) {
      query = query.eq('user_id', req.user.userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const payments = (data || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      userName: p.user_name,
      courseId: p.course_id,
      amount: p.amount,
      transactionId: p.transaction_id,
      senderName: p.sender_name,
      screenshotUrl: p.screenshot_url,
      status: p.status,
      createdAt: p.created_at,
      course: p.courses ? {
        title: p.courses.title,
        price: p.courses.price
      } : undefined
    }));

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch payment requests',
      code: 'FETCH_FAILED'
    });
  }
});

// POST /api/payments - Create payment request
router.post('/', verifyToken, validate(paymentSchema), async (req, res) => {
  try {
    const { courseId, amount, transactionId, senderName, screenshotUrl, userName } = req.body;

    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: req.user.userId,
        user_name: userName,
        course_id: courseId,
        amount,
        transaction_id: transactionId,
        sender_name: senderName,
        screenshot_url: screenshotUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Payment request submitted',
      data: {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        amount: data.amount,
        status: data.status,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit payment request',
      code: 'CREATE_FAILED'
    });
  }
});

// PUT /api/payments/:id/approve - Approve payment (Admin)
router.put('/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment details
    const { data: payment, error: fetchError } = await supabase
      .from('payment_requests')
      .select('user_id, course_id')
      .eq('id', id)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment request not found',
        code: 'NOT_FOUND'
      });
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create enrollment
    await supabase
      .from('enrollments')
      .insert({
        user_id: payment.user_id,
        course_id: payment.course_id,
        status: 'active'
      });

    res.json({
      success: true,
      message: 'Payment approved and user enrolled'
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve payment',
      code: 'APPROVE_FAILED'
    });
  }
});

// PUT /api/payments/:id/reject - Reject payment (Admin)
router.put('/:id/reject', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Payment request rejected'
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject payment',
      code: 'REJECT_FAILED'
    });
  }
});

export default router;
