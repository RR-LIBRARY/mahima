

# Comprehensive UI and Logic Update Plan

## What the Screenshots Reveal

1. **AllClasses page** ("Subjects" tab works but "Resources" tab shows "Resources coming soon" -- empty placeholder)
2. **PDF Viewer** has "Open in Drive", "Download", and "My Notes" footer cluttering the view
3. **Video Player** has a visible black bar masking in the middle area that should be removed; logo/watermark needs to be slightly larger
4. **Admin Upload** already has ContentDrillDown with breadcrumbs -- needs to stay synchronized with student view

---

## Phase 1: Video Player Fixes (MahimaGhostPlayer)

**File:** `src/components/video/MahimaGhostPlayer.tsx`

### 1a. Remove the middle black bar masking
The pause overlay (lines 563-571) creates a dark gradient over the entire video when paused. This causes the "black border half masking" visible in the screenshot. Change it to only cover the bottom portion (where YouTube branding lives) instead of the full viewport.

### 1b. Increase logo and watermark size
In the watermark section (lines 622-666):
- Increase left logo from `h-9 w-9` to `h-11 w-11`
- Increase right chip logo from `h-5 w-5` to `h-7 w-7`
- Increase "Mahima Academy" text from `text-xs` to `text-sm`
- Increase watermark bar height from `52px` to `60px` for better coverage

### 1c. Add Zoom/Fill toggle for mobile
Add a floating overlay button (top-left) that toggles between:
- **Fit Mode** (default `aspect-video` 16:9)
- **Fill Mode** (CSS `object-fit: cover` equivalent via `transform: scale()` to fill the viewport, cropping black bars)

Use the existing `VideoDisplayControls` component pattern. Add state `videoZoom` and apply CSS transform to the iframe container.

### 1d. Auto-hide controls on play, reappear on tap
Already implemented (lines 219-229 `handleMouseMove` with 3-second timeout). Add touch support by calling `handleMouseMove` on `onTouchStart` of the ghost overlay div.

---

## Phase 2: PDF Viewer -- Full-Page Clean Layout

**File:** `src/components/course/LectureModal.tsx`

When the lesson is a PDF/Drive type:
- Remove the entire bottom notes section (lines 221-328) -- hide the "Show Notes & Description" toggle, "My Notes" textarea, "Open in Drive" button, and "Download" button
- Make the DriveEmbedViewer iframe take `height: calc(100vh - 56px)` (full screen minus header height)
- Keep the header (title + close button) only

**File:** `src/components/course/DriveEmbedViewer.tsx`

- Remove the action buttons div (lines 59-69) with "Open in Drive" and "Download"
- Change `min-height: 70vh` to `height: 100%` so it fills the parent container
- Keep the `/preview` URL parameter for Google Drive links (already implemented)

---

## Phase 3: AllClasses "Resources" Tab

**File:** `src/pages/AllClasses.tsx`

The "Resources" tab (line 203-205) currently shows a static placeholder. Replace it with actual resources by:
- Fetching lessons that have `lecture_type` in ('PDF', 'DPP', 'NOTES', 'TEST') from all courses the student has access to (or all courses if using batch filter)
- Display them as a flat list of resource cards (reusing `LectureCard` component) grouped by type
- Each card opens the `LectureModal` when clicked

---

## Phase 4: Admin Upload Synchronization

**File:** `src/pages/Admin.tsx` and `src/components/admin/ContentDrillDown.tsx`

The admin ContentDrillDown already follows the breadcrumb pattern:
`All Courses > [Course] > [Chapter] > Content (with type tabs)`

This is already synchronized with the student-facing structure:
`AllClasses > ChapterView > LectureListing (with type tabs)`

No structural changes needed here. The "Upload Here" button already pre-selects course/chapter when switching to the Upload tab. This existing logic ensures content uploaded by admin automatically appears in the student's "All Classes" directory.

---

## Phase 5: WhiteLabelVideoPlayer Watermark Fix

**File:** `src/components/video/WhiteLabelVideoPlayer.tsx`

- Match the same watermark sizing as MahimaGhostPlayer (larger logo `h-8 w-8`, larger text `text-sm`)
- Ensure the bottom blocker height matches at `60px`
- The infinity/share button already exists (Share2 icon) -- keep it positioned at top-right with the Mahima logo

---

## Phase 6: Navigation Breadcrumbs Consistency

Already implemented across all views:
- `AllClasses.tsx`: Dashboard > All Classes > [Batch]
- `ChapterView.tsx`: All Classes > [Course] > Overview Syllabus
- `LectureListing.tsx`: All Classes > [Course] > Overview Syllabus > [Chapter]
- `MyCourseDetail.tsx`: Dashboard > My Courses > [Course]

No changes needed.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/video/MahimaGhostPlayer.tsx` | Remove middle black bar, increase logo/watermark size, add zoom/fill toggle, touch support |
| `src/components/course/LectureModal.tsx` | Hide notes/download footer for PDF content, make Drive viewer full-page |
| `src/components/course/DriveEmbedViewer.tsx` | Remove action buttons, full-height iframe |
| `src/pages/AllClasses.tsx` | Populate "Resources" tab with actual PDF/DPP/Notes/Test lessons from Supabase |
| `src/components/video/WhiteLabelVideoPlayer.tsx` | Match watermark sizing with MahimaGhostPlayer |

## What Does NOT Change

- Database schema (no new tables)
- Admin ContentDrillDown (already structured correctly)
- Authentication logic and admin email protection
- Sidebar navigation and routing
- Enrollment and payment flow
- ChapterView, LectureListing structure (already correct with breadcrumbs and type tabs)

