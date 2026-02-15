

# Admin Panel Restructure and Student Dashboard Synchronization

## Context

The uploaded `Advanced_prompt-2.md` requests a hierarchical breadcrumb-based content management system. However, following the project's stability constraints and the prompt's own rules ("DO NOT create separate database tables if similar exist", "USE EXISTING"), we will **enhance the existing schema** rather than creating parallel tables.

**Existing schema mapping:**
- `courses` table = Classes/Subjects (has `grade` field for batch filtering)
- `chapters` table = Chapters (linked to `course_id`)
- `lessons` table = All content types via `lecture_type` (VIDEO, PDF, DPP, NOTES, TEST)
- `materials` table = Supplementary materials
- `enrollments` table = User access control

No new database tables are needed. The existing structure already supports the full hierarchy: **Course > Chapter > Lesson (with type filtering)**.

---

## Phase 1: Fix Build Error

The "no package.json found" error is transient. A whitespace change to `package.json` triggers a clean rebuild.

**File:** `package.json` -- add trailing newline

---

## Phase 2: Admin Panel Content Management Restructure

### 2a. Replace flat Content tab with drill-down breadcrumb view

Currently the Admin Content tab shows a flat list of all lessons. Restructure it to follow the breadcrumb pattern:

**Breadcrumb flow:** `All Courses > [Selected Course] > [Selected Chapter] > Content (filtered by type tabs)`

**File:** `src/pages/Admin.tsx` -- modify the Content `TabsContent` section

Changes:
- Add state: `contentViewCourse` (selected course for drill-down), `contentViewChapter` (selected chapter)
- Level 1 (no course selected): Show grid of all courses as clickable cards
- Level 2 (course selected, no chapter): Show breadcrumb `All Courses > [Course Name]`, list all chapters as clickable cards with lesson counts
- Level 3 (course + chapter selected): Show breadcrumb `All Courses > [Course] > [Chapter]`, show content type tabs (All, Video, PDF, DPP, Notes, Test) filtering `lessons` by `lecture_type`, with edit/delete actions
- Add a breadcrumb bar at top of content section using the existing `Breadcrumb` UI component

### 2b. Upload tab - auto-select course/chapter from drill-down

When navigating from Content tab Level 2 or 3 to the Upload tab, pre-select the course and chapter so the admin doesn't have to re-pick them.

**File:** `src/pages/Admin.tsx` -- pass `contentViewCourse` and `contentViewChapter` as defaults when switching to Upload tab

---

## Phase 3: Student Dashboard Synchronization

The student-facing pages already follow the same breadcrumb pattern:
- `AllClasses` -> shows courses filtered by batch
- `ChapterView` -> shows chapters for a course
- `LectureListing` -> shows lessons for a chapter with type tabs

### 3a. Add content type tabs to LectureListing

**File:** `src/pages/LectureListing.tsx`

Add filter tabs matching the admin panel: All | Lectures | PDF | DPP | Notes | Test. Filter `lessons` by `lecture_type` field. This ensures the student sees the same content categories the admin uploads.

### 3b. Consistent breadcrumbs on MyCourseDetail

**File:** `src/pages/MyCourseDetail.tsx` -- already has breadcrumbs from prior edit. Verify chain: `My Courses > [Course Title]`

---

## Phase 4: Verify End-to-End with Real Accounts

After implementation, test with:
- **Admin** (naveenbharatprism@gmail.com / Ceomahima26): Login, navigate to Content tab, drill down Course > Chapter > see lessons by type, upload new content, verify it appears
- **Student** (anujkumar75yadav@gmail.com / 12345678): Login, All Classes > select course > chapters > see content with type tabs

---

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Trailing newline to fix build |
| `src/pages/Admin.tsx` | Restructure Content tab with drill-down breadcrumb navigation (Course > Chapter > Content with type tabs) |
| `src/pages/LectureListing.tsx` | Add content type filter tabs (All, Video, PDF, DPP, Notes, Test) matching admin structure |

## What Does NOT Change

- Database schema (no new tables -- uses existing courses, chapters, lessons)
- Video player components (MahimaGhostPlayer, UnifiedVideoPlayer)
- Authentication logic and admin email protection
- Sidebar navigation and routing
- Enrollment and payment flow
- AllClasses, ChapterView page structure (already correct)
- Notification bell (already working)

