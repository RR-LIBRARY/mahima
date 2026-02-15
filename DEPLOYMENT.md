# Mahima Academy - Deployment Guide

## 🚀 Overview

Mahima Academy is a complete e-learning platform built with React, TypeScript, and Supabase. This guide covers deployment, configuration, and administration.

---

## 📦 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack Query
- **Video Player**: Custom Premium Player (React Player)

---

## 🔧 Prerequisites

- Node.js 18+ or Bun 1.0+
- Supabase account with project
- Git

---

## 🛠️ Local Development Setup

### 1. Clone & Install

```bash
git clone <repository-url>
cd mahima-academy
npm install
# or
bun install
```

### 2. Environment Configuration

The app uses Supabase environment variables. These are automatically configured:

```env
VITE_SUPABASE_PROJECT_ID=yigafgqqypnzebrdlbgj
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_URL=https://yigafgqqypnzebrdlbgj.supabase.co
```

### 3. Start Development Server

```bash
npm run dev
# or
bun dev
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `courses` | Course catalog with title, description, price, grade |
| `lessons` | Video/content lessons linked to courses |
| `enrollments` | User-course enrollment records |
| `profiles` | Extended user profile data |
| `user_roles` | Role-based access control (admin/teacher/student) |
| `payment_requests` | Payment verification requests |
| `materials` | Downloadable course materials |
| `notices` | System-wide announcements |

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Students can view their own data
- Admins/Teachers can manage content
- Public access for course listings

---

## 👤 User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all features, payment approval, user management |
| `teacher` | Manage courses, lessons, materials, attendance |
| `student` | View courses, watch lessons, submit assignments |

### Setting Up Admin User

1. Register a new user through `/signup`
2. Go to Supabase Dashboard → SQL Editor
3. Run:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@example.com';

UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

---

## 📱 Application Routes

### Public Routes
- `/` - Landing page
- `/login` - Student login
- `/signup` - Student registration
- `/classes` - Course browser

### Student Routes
- `/dashboard` - Student dashboard
- `/classes/:courseId/lessons` - Lesson viewer with Premium Player
- `/buy-course` - Course purchase page

### Admin Routes
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard
- `/admin/upload` - Content upload center

---

## 🎬 Video Player Features

The Premium Video Player includes:
- ✅ Custom controls (hides YouTube branding)
- ✅ Playback speed control (0.5x - 2x)
- ✅ Keyboard shortcuts (Space, Arrow keys, M, F)
- ✅ Auto-hide controls after 4s inactivity
- ✅ Loading/buffering states
- ✅ Error handling
- ✅ Fullscreen support
- ✅ Academy watermark

### Supported Video Sources
- YouTube URLs
- YouTube Video IDs
- Direct video links

---

## 💳 Payment Flow

1. Student selects course and submits payment details
2. Payment request created in `payment_requests` table
3. Admin reviews in Admin Dashboard
4. On approval:
   - Payment status updated to 'approved'
   - Enrollment created for user
   - Course access unlocked

---

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. Connect repository to Vercel
2. Configure build settings:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables (if needed)
4. Deploy

### Option 2: Netlify

1. Connect repository
2. Build settings:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
3. Add `_redirects` file (already included):
   ```
   /* /index.html 200
   ```

### Option 3: Self-Hosted

```bash
# Build production bundle
npm run build

# Serve with any static server
npx serve dist
# or
nginx / Apache configuration
```

---

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] Admin routes protected by role check
- [x] Secure password handling via Supabase Auth
- [x] No exposed API keys in frontend code
- [x] CORS configured properly
- [x] Input validation on forms

---

## 📊 Admin Dashboard Features

- **Statistics**: Total students, revenue, enrollments
- **Payment Management**: Approve/reject payment requests
- **Course Management**: Create, edit, delete courses
- **Content Upload**: Upload videos and PDFs
- **User Management**: View users with roles
- **Export**: CSV export functionality

---

## 🔧 Supabase Configuration

### Storage Buckets Required

| Bucket | Purpose | Public |
|--------|---------|--------|
| `receipts` | Payment screenshots | Yes |
| `course-videos` | Video content | Yes |
| `course-materials` | PDFs, documents | Yes |

### Database Functions

- `has_role(user_id, role)` - Check user role
- `get_user_role(user_id)` - Get user's role
- `handle_new_user()` - Auto-create profile on signup

---

## 🐛 Troubleshooting

### Video Not Loading
- Check if YouTube video is public/unlisted
- Verify video URL format
- Check browser console for errors

### Access Denied Errors
- Verify user has correct role
- Check RLS policies in Supabase
- Ensure user is logged in

### Payment Not Approved
- Check `payment_requests` table status
- Verify admin has approved
- Check `enrollments` table for duplicate prevention

---

## 📞 Support

For technical issues:
1. Check browser console for errors
2. Review Supabase logs
3. Verify database policies

---

## 📝 Version History

- **v1.0.0** - Initial release
  - Core course management
  - Student enrollment
  - Payment system
  - Premium video player

---

## 📄 License

Proprietary - Mahima Academy © 2024
