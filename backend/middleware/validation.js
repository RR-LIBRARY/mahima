import { z } from 'zod';

// Validation middleware factory
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    next(error);
  }
};

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required').optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Course schemas
export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  grade: z.string().optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional()
});

// Lesson schemas
export const lessonSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  videoUrl: z.string().url('Invalid video URL'),
  isLocked: z.boolean().optional()
});

// Message schemas
export const messageSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required')
});

// Notice schemas
export const noticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isPinned: z.boolean().optional(),
  targetRole: z.enum(['admin', 'teacher', 'student']).optional().nullable(),
  expiresAt: z.string().optional()
});

// Timetable schemas
export const timetableSchema = z.object({
  courseId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  teacherId: z.string().uuid().optional()
});

// Payment schemas
export const paymentSchema = z.object({
  courseId: z.number({ required_error: 'Course ID is required' }),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  transactionId: z.string().max(200).optional(),
  senderName: z.string().max(200).optional(),
  screenshotUrl: z.string().url('Invalid screenshot URL').optional(),
  userName: z.string().max(200).optional()
});

// Enrollment schemas
export const enrollmentSchema = z.object({
  courseId: z.number({ required_error: 'Course ID is required' })
});

// Material schemas
export const materialSchema = z.object({
  courseId: z.number().optional().nullable(),
  lessonId: z.string().uuid('Invalid lesson ID').optional().nullable(),
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.string().min(1, 'File type is required').max(50),
  fileSize: z.number().min(0).optional().nullable()
});

// Lesson update schema (for PUT)
export const lessonUpdateSchema = z.object({
  courseId: z.number().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  isLocked: z.boolean().optional()
});

// Timetable update schema (for PUT)
export const timetableUpdateSchema = z.object({
  courseId: z.number().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().max(100).optional(),
  teacherId: z.string().uuid().optional()
});

// Notice update schema (for PUT)
export const noticeUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(10000).optional(),
  isPinned: z.boolean().optional(),
  targetRole: z.enum(['admin', 'teacher', 'student']).optional().nullable(),
  expiresAt: z.string().optional()
});

export default { validate, registerSchema, loginSchema, courseSchema, lessonSchema, messageSchema, noticeSchema, timetableSchema, paymentSchema, enrollmentSchema, materialSchema, lessonUpdateSchema, timetableUpdateSchema, noticeUpdateSchema };
