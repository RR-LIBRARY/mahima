import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../middleware/validation.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        code: 'REGISTRATION_FAILED'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ 
        success: false, 
        error: error.message,
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, mobile')
      .eq('id', data.user.id)
      .single();

    // Fetch user role from user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();

    const role = roleData?.role || profile?.role || 'student';

    res.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name,
        mobile: profile?.mobile,
        role
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed. Please try again.',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, mobile, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        mobile: profile.mobile,
        role: req.user.role || profile.role,
        createdAt: profile.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get user data',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT /api/auth/profile - Update profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, mobile } = req.body;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        mobile
      })
      .eq('id', req.user.userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update profile',
      code: 'UPDATE_FAILED'
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    res.json({
      success: true,
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

export default router;
