import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import coursesRoutes from './routes/courses.js';
import lessonsRoutes from './routes/lessons.js';
import enrollmentsRoutes from './routes/enrollments.js';
import materialsRoutes from './routes/materials.js';
import messagesRoutes from './routes/messages.js';
import noticesRoutes from './routes/notices.js';
import timetableRoutes from './routes/timetable.js';
import studentsRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import paymentsRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL, // Render ENV variable
    'http://localhost:8080',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://mahimaacademy.vercel.app',
  ].filter(Boolean), // Remove undefined values if env is missing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ADDED: Root Route (Browser check ke liye)
app.get('/', (req, res) => {
  res.status(200).send('🚀 Mahima Academy Backend is Running Successfully!');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentsRoutes);

// 404 handler (Invalid URLs ke liye)
app.use('/api/{*path}', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    error: err.message || 'Internal server error',
    code: 'SERVER_ERROR'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

export default app;