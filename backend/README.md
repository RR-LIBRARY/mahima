# Mahima Academy Backend

Express.js backend API for Mahima Online School.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh` - Refresh token

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Lessons
- `GET /api/lessons` - Get all lessons
- `GET /api/lessons/:id` - Get lesson by ID
- `GET /api/lessons/course/:courseId` - Get lessons by course
- `POST /api/lessons` - Create lesson (Admin/Teacher)
- `PUT /api/lessons/:id` - Update lesson (Admin/Teacher)
- `DELETE /api/lessons/:id` - Delete lesson (Admin/Teacher)

### Enrollments
- `GET /api/enrollments` - Get user's enrollments
- `GET /api/enrollments/:courseId` - Check enrollment status
- `POST /api/enrollments` - Enroll in course
- `DELETE /api/enrollments/:id` - Cancel enrollment (Admin)

### Materials
- `GET /api/materials` - Get all materials
- `GET /api/materials/:id` - Get material by ID
- `POST /api/materials` - Create material (Admin/Teacher)
- `DELETE /api/materials/:id` - Delete material (Admin/Teacher)

### Messages
- `GET /api/messages/inbox` - Get inbox messages
- `GET /api/messages/sent` - Get sent messages
- `GET /api/messages/unread-count` - Get unread count
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create notice (Admin/Teacher)
- `PUT /api/notices/:id` - Update notice (Admin/Teacher)
- `DELETE /api/notices/:id` - Delete notice (Admin/Teacher)

### Timetable
- `GET /api/timetable` - Get timetable
- `GET /api/timetable/today` - Get today's schedule
- `POST /api/timetable` - Create entry (Admin/Teacher)
- `PUT /api/timetable/:id` - Update entry (Admin/Teacher)
- `DELETE /api/timetable/:id` - Delete entry (Admin/Teacher)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Add student (Admin/Teacher)
- `PUT /api/students/:id` - Update student (Admin/Teacher)
- `DELETE /api/students/:id` - Delete student (Admin/Teacher)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (Admin/Teacher)
- `POST /api/attendance/bulk` - Bulk mark attendance (Admin/Teacher)
- `DELETE /api/attendance/:id` - Delete record (Admin/Teacher)

### Payments
- `GET /api/payments` - Get payment requests
- `POST /api/payments` - Submit payment request
- `PUT /api/payments/:id/approve` - Approve payment (Admin)
- `PUT /api/payments/:id/reject` - Reject payment (Admin)

## Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env.example`
